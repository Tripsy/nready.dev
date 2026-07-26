import { expect, jest } from '@jest/globals';
import { Configuration } from '@/config/settings.config';
import { getAccountRecoveryMock } from '@/features/account/account.mock';
import type AccountRecoveryEntity from '@/features/account/account-recovery.entity';
import type { AccountRecoveryQuery } from '@/features/account/account-recovery.repository';
import { AccountRecoveryService } from '@/features/account/account-recovery.service';
import { createPastDate } from '@/helpers/date.helper';
import type { TokenMetadata } from '@/helpers/meta-data.helper';
import { createMockRepository } from '@/tests/jest-service.setup';

function getMetadataMock(): TokenMetadata {
	return {
		'user-agent': 'Mozilla/5.0',
		'accept-language': 'en-GB',
		ip: '127.0.0.1',
		os: 'Windows',
	};
}

describe('AccountRecoveryService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockAccountRecovery = createMockRepository<
		AccountRecoveryEntity,
		AccountRecoveryQuery
	>();

	const serviceAccountRecovery = new AccountRecoveryService(
		mockAccountRecovery.repository,
	);

	describe('update', () => {
		it('should save the given data', async () => {
			const entity = getAccountRecoveryMock();

			mockAccountRecovery.repository.save.mockResolvedValue(entity);

			const result = await serviceAccountRecovery.update({
				id: entity.id,
				used_at: entity.used_at,
			});

			expect(mockAccountRecovery.repository.save).toHaveBeenCalledWith({
				id: entity.id,
				used_at: entity.used_at,
			});

			expect(result).toBe(entity);
		});
	});

	describe('setupRecovery', () => {
		it('should persist a recovery row and return its ident and expiry', async () => {
			const user = { id: 7 };
			const metadata = getMetadataMock();

			mockAccountRecovery.repository.save.mockResolvedValue(
				getAccountRecoveryMock(),
			);

			const before = Date.now();

			const [ident, expireAt] =
				await serviceAccountRecovery.setupRecovery(user, metadata);

			const saved = mockAccountRecovery.repository.save.mock
				.calls[0][0] as AccountRecoveryEntity;

			expect(saved.user_id).toBe(user.id);
			expect(saved.ident).toBe(ident);
			expect(saved.metadata).toEqual(metadata);
			expect(saved.expire_at).toBe(expireAt);

			// The returned ident is the uuid v4 written to the row — it is what ends up in
			// the recovery link, so its shape matters.
			expect(ident).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);

			// Expiry is `now + user.recoveryIdentExpiresIn`, within a second of the call.
			const expectedTtl = Configuration.get(
				'user.recoveryIdentExpiresIn',
			) as number;

			expect(expireAt.getTime()).toBeGreaterThanOrEqual(
				before + expectedTtl * 1000 - 1000,
			);
			expect(expireAt.getTime()).toBeLessThanOrEqual(
				Date.now() + expectedTtl * 1000 + 1000,
			);
		});

		it('should generate a different ident on each call', async () => {
			mockAccountRecovery.repository.save.mockResolvedValue(
				getAccountRecoveryMock(),
			);

			const [first] = await serviceAccountRecovery.setupRecovery(
				{ id: 1 },
				getMetadataMock(),
			);
			const [second] = await serviceAccountRecovery.setupRecovery(
				{ id: 1 },
				getMetadataMock(),
			);

			expect(first).not.toBe(second);
		});
	});

	describe('removeAccountRecoveryForUser', () => {
		it('should hard-delete every recovery row for the user', async () => {
			mockAccountRecovery.query.delete.mockResolvedValue(2);

			await serviceAccountRecovery.removeAccountRecoveryForUser(7);

			expect(mockAccountRecovery.query.filterBy).toHaveBeenCalledWith(
				'user_id',
				7,
			);

			// (isSoftDelete: false, multiple: true) — recovery rows are throwaway, and
			// leaving soft-deleted ones behind would keep spent idents queryable.
			expect(mockAccountRecovery.query.delete).toHaveBeenCalledWith(
				false,
				true,
			);
		});
	});

	describe('countRecoveryAttempts', () => {
		it('should count the user rows created since the given date', async () => {
			const sinceDate = createPastDate(21600);

			mockAccountRecovery.query.count.mockResolvedValue(3);

			const result = await serviceAccountRecovery.countRecoveryAttempts(
				7,
				sinceDate,
			);

			expect(mockAccountRecovery.query.filterBy).toHaveBeenCalledWith(
				'user_id',
				7,
			);
			expect(
				mockAccountRecovery.query.filterByRange,
			).toHaveBeenCalledWith('created_at', sinceDate);

			expect(result).toBe(3);
		});
	});

	describe('findByIdent', () => {
		it('should look the row up by ident and return it', async () => {
			const entity = getAccountRecoveryMock();

			mockAccountRecovery.query.first.mockResolvedValue(entity);

			const result = await serviceAccountRecovery.findByIdent(
				entity.ident,
			);

			expect(mockAccountRecovery.query.select).toHaveBeenCalledWith([
				'id',
				'user_id',
				'metadata',
				'used_at',
				'expire_at',
			]);
			expect(
				mockAccountRecovery.query.filterByIdent,
			).toHaveBeenCalledWith(entity.ident);

			expect(result).toBe(entity);
		});

		it('should honour an explicit field list', async () => {
			mockAccountRecovery.query.first.mockResolvedValue(null);

			const result = await serviceAccountRecovery.findByIdent('missing', [
				'id',
			]);

			expect(mockAccountRecovery.query.select).toHaveBeenCalledWith([
				'id',
			]);

			expect(result).toBeNull();
		});
	});
});
