/**
 * The image a feature shows for one of its own rows, looked up without importing the feature that
 * stores images.
 *
 * `image` writes against `(section, entity_id)` with no foreign key to anything, so a target has
 * no relation to walk and would otherwise have to reach into the image repository to find its own
 * picture — which is what `article` did, and what made optional decoration a hard install-time
 * dependency. A project should be able to take `article`, `brand` or `category` and leave the
 * image library behind.
 *
 * **The direction is the opposite of `target-participation.config.ts`.** There the *target*
 * registers an answer about its own rows and the writing feature asks. Here the *provider*
 * registers: which image comes first, and what one looks like, is the storing feature's own rule.
 * The features rendering a page ask by their own table name.
 *
 * **One provider, not one per section.** Participation keys its map by target because each target
 * owns its own switch. Every section's images live in one table owned by one feature, so a second
 * slot would invent a plurality that does not exist.
 *
 * **With nothing registered, nothing has an image.** That is what an uninstalled `image` looks
 * like, and it is the state of every request under `test`, where `bootstrap.setup.ts` skips the
 * registration pass. A consumer renders that as an explicit `null` and never as a missing field: a
 * client must not have to tell "this row has no image" apart from "this deployment has no image
 * feature".
 *
 * The vocabulary here is deliberately the *storing* feature's — an image and its type — not the
 * role a page casts it in. What an article calls its `cover_image` is article's word for the first
 * gallery image; a brand asking the same registry for its `logo` is not asking for a cover.
 */

/**
 * What an image is for. A target asks for the kind it wants: a brand shows its `logo`, an article
 * the first of its `gallery`.
 *
 * Declared here rather than imported from the image feature even though it duplicates
 * `ImageTypeEnum` — that import is the dependency this file exists to remove. The duplication is
 * the tripwire: a provider whose own enum grows past this one stops compiling in its bootstrap,
 * which is where somebody should notice that consumers gained an option.
 */
export const TargetImageTypeEnum = {
	LOGO: 'logo',
	GALLERY: 'gallery',
} as const;

export type TargetImageType =
	(typeof TargetImageTypeEnum)[keyof typeof TargetImageTypeEnum];

/**
 * How the file is reached — the vocabulary the API promises its clients, owned here for the same
 * reason as the type above, and mirroring `ImageStorageEnum`.
 */
export const TargetImageStorageEnum = {
	LOCAL: 'local',
	S3: 's3',
} as const;

export type TargetImageStorage =
	(typeof TargetImageStorageEnum)[keyof typeof TargetImageStorageEnum];

/**
 * Whatever the provider knows about the file; an older row may know none of it. `mime` stays a
 * plain string — no consumer branches on it, so restating the five literals buys nothing.
 */
export type TargetImageProperties = {
	width?: number;
	height?: number;
	size?: number;
	mime?: string;
};

export type TargetImage = {
	id: number;
	path: string;
	storage: TargetImageStorage;
	properties: TargetImageProperties | null;
};

/**
 * Answers for a whole page at once, keyed by entity id; an id with no image of that type is simply
 * absent from the map. Batched because a listing must not turn into one query per card.
 *
 * `section` is the target's table name (`ArticleEntity.NAME`), the way a polymorphic target is
 * named everywhere here. A provider that does not serve that section answers with an empty map
 * rather than failing — an unknown section is a deployment fact, not an error.
 *
 * Which of several images wins is the provider's rule, not the caller's: it returns the first by
 * whatever order it keeps them in.
 */
export type TargetImageProvider = (
	section: string,
	imageType: TargetImageType,
	entityIds: number[],
) => Promise<Map<number, TargetImage>>;

let targetImageProvider: TargetImageProvider | null = null;

/**
 * Called from the providing feature's `*.bootstrap.ts`. Registering twice replaces the previous
 * provider rather than adding a second opinion — a reload, not a second source of images.
 */
export const registerTargetImageProvider = (
	provider: TargetImageProvider,
): void => {
	targetImageProvider = provider;
};

export const resolveTargetImages = async (
	section: string,
	imageType: TargetImageType,
	entityIds: number[],
): Promise<Map<number, TargetImage>> => {
	if (!targetImageProvider || entityIds.length === 0) {
		return new Map();
	}

	return targetImageProvider(section, imageType, entityIds);
};
