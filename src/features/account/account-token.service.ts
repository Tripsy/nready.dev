import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import type { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Configuration } from '@/config/settings.config';
import { CustomError } from '@/exceptions';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import {
	type AccountTokenQuery,
	getAccountTokenRepository,
} from '@/features/account/account-token.repository';
import type UserEntity from '@/features/user/user.entity';
import {
	createCurrentDate,
	createFutureDate,
	getErrorMessage,
	getMetaDataValue,
	tokenMetaData,
} from '@/helpers';

export type AuthTokenPayload = {
	user_id: number;
	ident: string;
};

export type AuthValidToken = {
	ident: string;
	label: string;
	used_at: Date | null;
	used_now: boolean;
};

export class AccountTokenService {
	constructor(
		private accountTokenRepository: Repository<AccountTokenEntity> & {
			createQuery(): AccountTokenQuery;
		},
	) {}

	/**
	 * @description Gets the auth token from the request headers
	 * @param req
	 */
	public getAuthTokenFromHeaders(req: Request): string | undefined {
		return req.headers.authorization?.split(' ')[1];
	}

	/**
	 * @description Verify auth token and return payload
	 * @param token
	 */
	public determineAuthTokenPayload(token: string): AuthTokenPayload {
		try {
			return jwt.verify(
				token,
				Configuration.get('user.authSecret') as string,
			) as AuthTokenPayload;
		} catch (err) {
			throw new CustomError(
				406,
				`Unable to verify token ${getErrorMessage(err)}`,
			);
		}
	}

	/**
	 * @description Gets the active auth token from the request headers
	 */
	public findByToken(token: string): Promise<AccountTokenEntity> {
		// Verify JWT and extract payload
		const authTokenPayload = this.determineAuthTokenPayload(token);

		return this.accountTokenRepository
			.createQuery()
			.filterByIdent(authTokenPayload.ident)
			.filterBy('user_id', authTokenPayload.user_id)
			.firstOrFail();
	}

	/**
	 * @description Generates a new auth token
	 */
	public generateAuthToken(user: Partial<UserEntity> & { id: number }): {
		token: string;
		ident: string;
		expire_at: Date;
	} {
		if (!user.id) {
			throw new Error('User object must contain `id` property.');
		}

		const ident: string = uuid();
		const expire_at: Date = createFutureDate(
			Configuration.get('user.authExpiresIn') as number,
		);

		const payload: AuthTokenPayload = {
			user_id: user.id,
			ident: ident,
		};

		const token = jwt.sign(
			payload,
			Configuration.get('user.authSecret') as string,
		);

		return { token, ident, expire_at };
	}

	/**
	 * @description Gets the valid auth tokens for a user via repository
	 */
	public async getAuthValidTokens(
		user_id: number,
	): Promise<AuthValidToken[]> {
		const authValidTokens = await this.accountTokenRepository
			.createQuery()
			.select(['id', 'ident', 'metadata', 'used_at'])
			.filterBy('user_id', user_id)
			.filterByRange('expire_at', createCurrentDate())
			.all(false);

		return authValidTokens.map((token) => {
			return {
				ident: token.ident,
				label: token.metadata
					? getMetaDataValue(token.metadata, 'user-agent')
					: '',
				used_at: token.used_at,
				used_now: false,
			};
		});
	}

	/**
	 * @description Creates a new auth token via repository
	 */
	private createAuthToken(
		data: Partial<AccountTokenEntity>,
	): Promise<AccountTokenEntity> {
		const entry = {
			user_id: data.user_id,
			ident: data.ident,
			metadata: data.metadata,
			used_at: data.used_at,
			expire_at: data.expire_at,
		};

		return this.accountTokenRepository.save(entry);
	}

	/**
	 * @description Generate a new auth token and returns the token
	 */
	public async setupAuthToken(
		user: Partial<UserEntity> & { id: number },
		req: Request,
	): Promise<string> {
		const { token, ident, expire_at } = this.generateAuthToken(user);

		await this.createAuthToken({
			user_id: user.id,
			ident: ident,
			metadata: tokenMetaData(req),
			used_at: createCurrentDate(),
			expire_at: expire_at,
		});

		return token;
	}

	/**
	 * @description Removes all auth tokens for a user
	 */
	public async removeAccountTokenForUser(user_id: number): Promise<void> {
		await this.accountTokenRepository
			.createQuery()
			.filterBy('user_id', user_id)
			.delete(false, true);
	}

	/**
	 * @description Removes a single auth token for a user
	 */
	public async removeAccountTokenByIdent(ident: string): Promise<void> {
		await this.accountTokenRepository
			.createQuery()
			.filterByIdent(ident)
			.delete(false);
	}
}

export const accountTokenService = new AccountTokenService(
	getAccountTokenRepository(),
);
