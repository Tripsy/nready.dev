export const UserRoleEnum = {
	ADMIN: 'admin',
	MEMBER: 'member',
	OPERATOR: 'operator',
} as const;

export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];
