export const PlaceTypeEnum = {
	COUNTRY: 'country',
	REGION: 'region',
	CITY: 'city',
} as const;

export type PlaceType = (typeof PlaceTypeEnum)[keyof typeof PlaceTypeEnum];
