import { NotAllowedError, UnauthorizedError } from '@/exceptions';
import type { AuthContext } from '@/shared/types/express';
import { UserRoleEnum } from '@/shared/types/user-role.type';

class PolicyAbstract {
	private allowed_auth_id: number[] = [];

	constructor(readonly entity: string) {}

	public pushAllowedAuthId(id: number | number[]) {
		if (Array.isArray(id)) {
			this.allowed_auth_id.push(...id);
		} else {
			this.allowed_auth_id.push(id);
		}
		return this;
	}

	public getId(auth: AuthContext): number | undefined {
		return auth?.id;
	}

	public getRole(auth: AuthContext): string {
		return auth?.role || 'visitor';
	}

	public getPermissions(auth: AuthContext): string[] {
		return auth?.permissions || [];
	}

	public permission(operation: string, entity?: string): string {
		return `${entity || this.entity}.${operation}`;
	}

	public isAuthenticated(auth: AuthContext): boolean {
		return !!this.getId(auth);
	}

	public isVisitor(auth: AuthContext): boolean {
		return this.getRole(auth) === 'visitor';
	}

	public isAdmin(auth: AuthContext): boolean {
		return this.getRole(auth) === UserRoleEnum.ADMIN;
	}

	protected isOperator(auth: AuthContext): boolean {
		return this.getRole(auth) === UserRoleEnum.OPERATOR;
	}

	/**
	 * Returns `true` if is operator and owns the permission
	 *
	 * @param auth
	 * @param permission (e.g.: `user.delete`, `user.update`, etc...)
	 */
	public hasPermission(auth: AuthContext, permission: string): boolean {
		if (!/^[^.]+\.[^.]+$/.test(permission)) {
			throw new Error(`Invalid permission format: ${permission}`);
		}

		return this.getPermissions(auth).includes(permission);
	}

	/**
	 * Returns `true` if the user is admin or has the `delete` permission on the selected entity.
	 * This method is used to allow permission `view` of soft deleted resources
	 */
	public allowDeleted(auth: AuthContext): boolean {
		return (
			this.isAdmin(auth) ||
			this.hasPermission(auth, this.permission('delete'))
		);
	}

	/**
	 * Check if the user is allowed to perform the operation
	 * Returns `true` if the user is admin or the user is the owner of the resource or owns the permission
	 */
	public isAllowed(auth: AuthContext, permission: string): boolean {
		if (this.isAdmin(auth)) {
			return true;
		}

		if (this.hasPermission(auth, permission)) {
			return true;
		}

		const auth_id = this.getId(auth);

		if (auth_id && this.allowed_auth_id.includes(auth_id)) {
			return true;
		}

		return false;
	}

	public requiredAuth(auth: AuthContext): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}
	}

	public notAuth(auth: AuthContext): void {
		if (this.isAuthenticated(auth)) {
			throw new NotAllowedError();
		}
	}

	public canCreate(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('create', entity);

		if (!this.isAllowed(auth, permission)) {
			throw new NotAllowedError();
		}
	}

	public canRead(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('read', entity);

		if (!this.isAllowed(auth, permission)) {
			throw new NotAllowedError();
		}
	}

	public canUpdate(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('update', entity);

		if (!this.isAllowed(auth, permission)) {
			throw new NotAllowedError();
		}
	}

	public canDelete(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('delete', entity);

		if (!this.isAllowed(auth, permission)) {
			throw new NotAllowedError();
		}
	}

	/**
	 * Restore action is the same as delete
	 *
	 * @param auth
	 * @param entity
	 */
	public canRestore(auth: AuthContext, entity?: string): void {
		this.canDelete(auth, entity);
	}

	public canFind(auth: AuthContext, entity?: string): void {
		if (!this.isAuthenticated(auth)) {
			throw new UnauthorizedError();
		}

		const permission: string = this.permission('find', entity);

		if (!this.isAllowed(auth, permission)) {
			throw new NotAllowedError();
		}
	}
}

export default PolicyAbstract;
