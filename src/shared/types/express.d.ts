import { UserOperatorTypeEnum } from '@/features/user/user.entity';
import { OutputWrapper } from '@/middleware/output-handler.middleware';
import { UserRoleEnum } from '@/shared/types/user-role.type';

export type AuthContext = {
	id: number;
	email: string;
	name: string;
	language: string;
	role: UserRoleEnum | 'visitor';
	operator_type: UserOperatorTypeEnum | null;
	permissions: string[];
	activeToken: string;
};

declare global {
	namespace Express {
		interface Locals {
			request_id: string;
			auth: AuthContext;
			output: OutputWrapper;
			lang: string;
		}
	}
}
