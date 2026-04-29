import { expect, jest } from '@jest/globals';
import type PermissionEntity from '@/features/permission/permission.entity';
import {
	getPermissionEntityMock,
	permissionInputPayloads,
	permissionOutputPayloads,
} from '@/features/permission/permission.mock';
import type { PermissionQuery } from '@/features/permission/permission.repository';
import { PermissionService } from '@/features/permission/permission.service';
import type { PermissionValidator } from '@/features/permission/permission.validator';
import { createCurrentDate } from '@/helpers';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
} from '@/tests/jest-service.setup';

describe('PermissionService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockPermission = createMockRepository<
		PermissionEntity,
		PermissionQuery
	>();

	const servicePermission = new PermissionService(mockPermission.repository);

	it('should create entry', async () => {
		const entity = getPermissionEntityMock();
		const createData = permissionOutputPayloads.manage;

		mockPermission.query.first.mockResolvedValue(null);
		mockPermission.repository.save.mockResolvedValue(entity);

		const result = await servicePermission.create(false, createData);

		expect(result).toHaveProperty('permission', entity);
		expect(result).toHaveProperty('action', 'create');
	});

	it('should restore when creating with deleted existing', async () => {
		const entity = {
			...getPermissionEntityMock(),
			deleted_at: createCurrentDate(),
		};
		const createData = permissionOutputPayloads.manage;

		mockPermission.query.first.mockResolvedValue(entity);
		mockPermission.query.restore.mockReturnThis();

		const result = await servicePermission.create(true, createData);

		expect(result.action).toBe('restore');
		expect(mockPermission.query.restore).toHaveBeenCalled();
	});

	it('should updateData', async () => {
		const entity = getPermissionEntityMock();
		const updateData = permissionOutputPayloads.manage;

		mockPermission.query.first.mockResolvedValue(null);
		mockPermission.repository.save.mockResolvedValue(entity);

		const result = await servicePermission.updateData(1, updateData);

		expect(mockPermission.repository.save).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 1,
				entity: 'user',
				operation: 'create',
			}),
		);
		expect(result).toBe(entity);
	});

	testServiceFindById<PermissionEntity, PermissionQuery>(
		mockPermission.query,
		servicePermission,
	);

	testServiceFindByFilter<
		PermissionEntity,
		PermissionQuery,
		PermissionValidator
	>(mockPermission.query, servicePermission, permissionInputPayloads.find);

	testServiceDelete<PermissionEntity, PermissionQuery>(
		mockPermission.query,
		servicePermission,
	);

	testServiceRestore<PermissionEntity, PermissionQuery>(
		mockPermission.query,
		servicePermission,
	);
});
