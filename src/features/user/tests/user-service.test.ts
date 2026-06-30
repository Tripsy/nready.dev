import { expect, jest } from '@jest/globals';
import type AccountTokenEntity from '@/features/account/account-token.entity';
import type { AccountTokenQuery } from '@/features/account/account-token.repository';
import { AccountTokenService } from '@/features/account/account-token.service';
import type UserEntity from '@/features/user/user.entity';
import { type UserStatus, UserStatusEnum } from '@/features/user/user.entity';
import {
	getUserEntityMock,
	userOutputPayloads,
} from '@/features/user/user.mock';
import type { UserQuery } from '@/features/user/user.repository';
import { UserService } from '@/features/user/user.service';
import type { UserValidator } from '@/features/user/user.validator';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
	testServiceUpdateStatus,
} from '@/tests/jest-service.setup';

describe('UserService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockUser = createMockRepository<UserEntity, UserQuery>();
	const mockAccountToken = createMockRepository<
		AccountTokenEntity,
		AccountTokenQuery
	>();

	const serviceAccountToken = new AccountTokenService(
		mockAccountToken.repository,
	);
	const serviceUser = new UserService(
		mockUser.repository,
		serviceAccountToken,
	);

	it('should create entry', async () => {
		const entity = getUserEntityMock();
		const createData = userOutputPayloads.create;

		jest.spyOn(serviceUser, 'findByEmail').mockResolvedValue(null);
		mockUser.repository.save.mockResolvedValue(entity);

		const result = await serviceUser.create(createData);

		expect(mockUser.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<UserEntity>(
		serviceUser,
		mockUser.repository,
		getUserEntityMock(),
	);

	testServiceUpdateStatus<UserEntity, UserStatus>(
		serviceUser,
		mockUser.repository,
		{
			good: { from: UserStatusEnum.INACTIVE, to: UserStatusEnum.ACTIVE },
			bad: undefined,
		},
	);

	testServiceDelete<UserEntity, UserQuery>(mockUser.query, serviceUser);

	testServiceRestore<UserEntity, UserQuery>(mockUser.query, serviceUser);

	testServiceFindById<UserEntity, UserQuery>(mockUser.query, serviceUser);

	it('should find entity by email', async () => {
		const entity = getUserEntityMock();

		mockUser.query.first.mockResolvedValue(entity);

		const result = await serviceUser.findByEmail(entity.email);

		expect(mockUser.query.filterByEmail).toHaveBeenCalledWith(entity.email);
		expect(mockUser.query.first).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceFindByFilter<UserEntity, UserQuery, UserValidator>(
		mockUser.query,
		serviceUser,
		userOutputPayloads.find,
	);
});
