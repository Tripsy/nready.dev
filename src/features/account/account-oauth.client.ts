import { lang } from '@/config/message.setup';
import { Configuration } from '@/config/settings.config';
import { BadRequestError, CustomError } from '@/exceptions';
import {
	type AccountIdentityProvider,
	AccountIdentityProviderEnum,
} from '@/features/account/account-identity.entity';
import { getErrorMessage } from '@/helpers/system.helper';
import { getSystemLogger } from '@/providers/logger.provider';

/**
 * What the application needs from a provider, normalized across them.
 *
 * `email` is nullable because Facebook can legitimately have none — an account registered
 * with a phone number, or one where the user declined the `email` scope.
 */
export type OAuthProfile = {
	provider_user_id: string;
	email: string | null;
	email_verified: boolean;
	name: string | null;
};

// Providers are slow-by-nature third parties; without a deadline a hung TLS connection
// would hold an Express worker for the full OS timeout.
const REQUEST_TIMEOUT = 10_000;

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

type GoogleIdTokenClaims = {
	iss?: string;
	aud?: string;
	sub?: string;
	exp?: number;
	email?: string;
	email_verified?: boolean;
	name?: string;
};

type FacebookProfile = {
	id?: string;
	name?: string;
	email?: string;
};

function providerCredentials(provider: AccountIdentityProvider): {
	clientId: string;
	clientSecret: string;
} {
	const credentials =
		provider === AccountIdentityProviderEnum.GOOGLE
			? {
					clientId: Configuration.get('oauth.google.clientId'),
					clientSecret: Configuration.get(
						'oauth.google.clientSecret',
					),
				}
			: {
					clientId: Configuration.get('oauth.facebook.clientId'),
					clientSecret: Configuration.get(
						'oauth.facebook.clientSecret',
					),
				};

	if (!credentials.clientId || !credentials.clientSecret) {
		// 501 rather than 400: the request was well-formed, the deployment simply does not
		// offer this provider.
		throw new CustomError(
			501,
			lang('account.error.oauth_provider_not_configured'),
		);
	}

	return credentials;
}

/**
 * Wraps `fetch` so that every failure mode maps onto a deliberate status code:
 * a 4xx from the provider means the code is bad or already spent (the client's problem),
 * anything else means the provider is unreachable or broken (not the client's problem).
 */
async function requestProvider<T>(
	url: string,
	init: RequestInit,
	provider: AccountIdentityProvider,
): Promise<T> {
	let response: Response;

	try {
		response = await fetch(url, {
			...init,
			signal: AbortSignal.timeout(REQUEST_TIMEOUT),
		});
	} catch (error) {
		getSystemLogger().error(
			{ err: error, provider },
			`OAuth request to ${provider} failed: ${getErrorMessage(error)}`,
		);

		throw new CustomError(502, lang('account.error.oauth_provider_error'));
	}

	if (!response.ok) {
		// The body carries the provider's own error description; useful in the log, never
		// worth returning to the client.
		const body = await response.text().catch(() => '');

		getSystemLogger().warn(
			{ provider, status: response.status, body },
			`OAuth request to ${provider} rejected`,
		);

		if (response.status >= 400 && response.status < 500) {
			throw new BadRequestError(lang('account.error.oauth_code_invalid'));
		}

		throw new CustomError(502, lang('account.error.oauth_provider_error'));
	}

	return (await response.json()) as T;
}

/**
 * Reads the claim set out of an id_token *without* verifying its signature.
 *
 * That is safe only in this exact position: the token came straight back from Google's
 * token endpoint over a TLS connection this process opened, authenticated with the client
 * secret. OpenID Connect Core §3.1.3.7 explicitly allows skipping signature validation for
 * tokens obtained that way, which saves fetching and caching Google's JWKS. The claims
 * that bind the token to *this* application (`aud`, `iss`, `exp`) are still checked below —
 * skipping those would accept a token minted for a different client.
 */
function readGoogleIdToken(idToken: string, clientId: string): OAuthProfile {
	const segments = idToken.split('.');

	if (segments.length !== 3) {
		throw new BadRequestError(lang('account.error.oauth_code_invalid'));
	}

	let claims: GoogleIdTokenClaims;

	try {
		claims = JSON.parse(
			Buffer.from(segments[1], 'base64url').toString('utf8'),
		) as GoogleIdTokenClaims;
	} catch {
		throw new BadRequestError(lang('account.error.oauth_code_invalid'));
	}

	const isValid =
		claims.aud === clientId &&
		!!claims.iss &&
		GOOGLE_ISSUERS.includes(claims.iss) &&
		!!claims.exp &&
		claims.exp * 1000 > Date.now() &&
		!!claims.sub;

	if (!isValid) {
		throw new BadRequestError(lang('account.error.oauth_code_invalid'));
	}

	return {
		provider_user_id: claims.sub as string,
		email: claims.email ?? null,
		email_verified: claims.email_verified === true,
		name: claims.name ?? null,
	};
}

async function resolveGoogleProfile(
	code: string,
	redirect_uri: string,
): Promise<OAuthProfile> {
	const { clientId, clientSecret } = providerCredentials(
		AccountIdentityProviderEnum.GOOGLE,
	);

	const { id_token } = await requestProvider<{ id_token?: string }>(
		GOOGLE_TOKEN_URL,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				code: code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code',
			}),
		},
		AccountIdentityProviderEnum.GOOGLE,
	);

	if (!id_token) {
		// Only happens when the authorization request omitted the `openid` scope.
		throw new BadRequestError(lang('account.error.oauth_code_invalid'));
	}

	return readGoogleIdToken(id_token, clientId);
}

async function resolveFacebookProfile(
	code: string,
	redirect_uri: string,
): Promise<OAuthProfile> {
	const { clientId, clientSecret } = providerCredentials(
		AccountIdentityProviderEnum.FACEBOOK,
	);

	const graphUrl = `https://graph.facebook.com/${Configuration.get('oauth.facebook.apiVersion')}`;

	const { access_token } = await requestProvider<{ access_token?: string }>(
		`${graphUrl}/oauth/access_token?${new URLSearchParams({
			code: code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirect_uri,
		})}`,
		{ method: 'GET' },
		AccountIdentityProviderEnum.FACEBOOK,
	);

	if (!access_token) {
		throw new BadRequestError(lang('account.error.oauth_code_invalid'));
	}

	/*
	 * No `/debug_token` round-trip: the token was just minted for this app id, using this
	 * app secret, on a connection this process opened. `debug_token` exists to catch tokens
	 * that arrived from an untrusted client — which is exactly the case the code exchange
	 * removes.
	 */
	const profile = await requestProvider<FacebookProfile>(
		`${graphUrl}/me?${new URLSearchParams({
			fields: 'id,name,email',
			access_token: access_token,
		})}`,
		{ method: 'GET' },
		AccountIdentityProviderEnum.FACEBOOK,
	);

	if (!profile.id) {
		throw new CustomError(502, lang('account.error.oauth_provider_error'));
	}

	return {
		provider_user_id: profile.id,
		email: profile.email ?? null,
		/*
		 * Graph exposes no `email_verified` field. An address only reaches the Graph
		 * response after Facebook has confirmed it on its own side, so its presence is the
		 * verification signal — there is nothing weaker to fall back to.
		 */
		email_verified: !!profile.email,
		name: profile.name ?? null,
	};
}

/**
 * Exchanges an authorization code for the user's profile at the given provider.
 */
export function resolveOAuthProfile(
	provider: AccountIdentityProvider,
	code: string,
	redirect_uri: string,
): Promise<OAuthProfile> {
	switch (provider) {
		case AccountIdentityProviderEnum.GOOGLE:
			return resolveGoogleProfile(code, redirect_uri);
		case AccountIdentityProviderEnum.FACEBOOK:
			return resolveFacebookProfile(code, redirect_uri);
	}
}
