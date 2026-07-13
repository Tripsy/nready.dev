import { expect, jest } from '@jest/globals';
import ImageEntity, {
	type ImageStatus,
	ImageStatusEnum,
} from '@/features/image/image.entity';
import {
	getImageEntityMock,
	imageInputPayloads,
	imageOutputPayloads,
} from '@/features/image/image.mock';
import type { ImageQuery } from '@/features/image/image.repository';
import { ImageService } from '@/features/image/image.service';
import type { ImageValidator } from '@/features/image/image.validator';
import { ImageContentRepository } from '@/features/image/image-content.repository';
import {
	createMockRepository,
	setupTransactionMock,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceUpdateStatus,
} from '@/tests/jest-service.setup';

describe('ImageService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockImage = createMockRepository<ImageEntity, ImageQuery>();
	const serviceImage = new ImageService(mockImage.repository);

	it('should create entry inside transaction and save content', async () => {
		const entity = getImageEntityMock();
		const createData = imageOutputPayloads.create;

		const { transaction } = setupTransactionMock();

		mockImage.repository.save.mockResolvedValue(entity);

		jest.spyOn(ImageContentRepository, 'saveContent').mockResolvedValue(
			undefined,
		);

		const result = await serviceImage.create(createData);

		expect(transaction).toHaveBeenCalled();

		expect(mockImage.repository.save).toHaveBeenCalledWith({
			section: createData.section,
			entity_id: createData.entity_id,
			image_type: createData.image_type,
		});

		expect(result).toBe(entity);
	});

	testServiceUpdateStatus<ImageEntity, ImageStatus>(
		serviceImage,
		mockImage.repository,
		{
			good: {
				from: ImageStatusEnum.INACTIVE,
				to: ImageStatusEnum.ACTIVE,
			},
			bad: undefined,
		},
	);

	it('updateOrder - success', async () => {
		mockImage.query.count.mockResolvedValue(2);

		const { transaction, manager } = setupTransactionMock();

		const orderData = imageOutputPayloads.orderUpdate;

		await serviceImage.updateOrder(
			imageOutputPayloads.orderUpdate.section,
			imageOutputPayloads.orderUpdate.entity_id,
			orderData.positions,
		);

		expect(transaction).toHaveBeenCalled();
		expect(manager.query).toHaveBeenCalled();
	});

	testServiceFindById<ImageEntity, ImageQuery>(mockImage.query, serviceImage);

	testServiceFindByFilter<ImageEntity, ImageQuery, ImageValidator>(
		mockImage.query,
		serviceImage,
		imageInputPayloads.find,
	);

	testServiceDelete<ImageEntity, ImageQuery>(mockImage.query, serviceImage);
});
