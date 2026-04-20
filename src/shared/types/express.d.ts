import { UserOperatorType } from '@/features/user/user.entity';
import { OutputWrapper } from '@/middleware/output-handler.middleware';
import { UserRole } from '@/shared/types/user-role.type';

export type AuthContext = {
	id: number;
	email: string;
	name: string;
	language: string;
	role: UserRole | 'visitor';
	operator_type: UserOperatorType | null;
	permissions: string[];
	activeToken: string;
};

declare global {
	namespace Express {
		interface Locals {
			request_id: string;
			auth: AuthContext;
			output: OutputWrapper;
			language: string;
		}
	}
}
