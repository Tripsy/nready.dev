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

		const { transaction } = setupTransactionMock(mockImage.repository);

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
			storage: createData.storage,
			path: createData.path,
			properties: createData.properties,
			sort_order: createData.sort_order,
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
		const orderData = imageOutputPayloads.orderUpdate;

		const { transaction } = setupTransactionMock(mockImage.repository);

		// The service loads the images by id, rejects the request if any is missing, then
		// saves them back with their new sort_order — so the builder has to return one
		// image per requested position.
		const images = orderData.positions.map((position) => ({
			...getImageEntityMock(),
			id: position.id,
			sort_order: 0,
		}));

		mockImage.queryBuilder.getMany.mockResolvedValue(images);

		await serviceImage.updateOrder(
			orderData.section,
			orderData.entity_id,
			orderData.positions,
		);

		expect(transaction).toHaveBeenCalled();

		expect(mockImage.repository.save).toHaveBeenCalledWith(
			orderData.positions.map((position) =>
				expect.objectContaining({
					id: position.id,
					sort_order: position.sort_order,
				}),
			),
		);
	});

	testServiceFindById<ImageEntity, ImageQuery>(mockImage.query, serviceImage);

	testServiceFindByFilter<ImageEntity, ImageQuery, ImageValidator>(
		mockImage.query,
		serviceImage,
		imageInputPayloads.find,
	);

	// `image` hard-deletes (`.delete(false)`) rather than soft-deleting.
	testServiceDelete<ImageEntity, ImageQuery>(mockImage.query, serviceImage, [
		false,
	]);
});
