import { expect, jest } from '@jest/globals';
import type TemplateEntity from '@/features/template/template.entity';
import {
	getTemplateEntityMock,
	templateOutputPayloads,
} from '@/features/template/template.mock';
import type { TemplateQuery } from '@/features/template/template.repository';
import { TemplateService } from '@/features/template/template.service';
import type { TemplateValidator } from '@/features/template/template.validator';
import {
	createMockRepository,
	testServiceDelete,
	testServiceFindByFilter,
	testServiceFindById,
	testServiceRestore,
	testServiceUpdate,
} from '@/tests/jest-service.setup';

describe('TemplateService', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const mockTemplate = createMockRepository<TemplateEntity, TemplateQuery>();

	const serviceTemplate = new TemplateService(mockTemplate.repository);

	it('should create entry', async () => {
		const entity = getTemplateEntityMock();
		const createData = templateOutputPayloads.create;

		mockTemplate.query.first.mockResolvedValue(null);
		mockTemplate.repository.save.mockResolvedValue(entity);

		const result = await serviceTemplate.create(createData);

		expect(mockTemplate.repository.save).toHaveBeenCalled();
		expect(result).toBe(entity);
	});

	testServiceUpdate<TemplateEntity>(
		serviceTemplate,
		mockTemplate.repository,
		getTemplateEntityMock(),
	);

	testServiceFindById<TemplateEntity, TemplateQuery>(
		mockTemplate.query,
		serviceTemplate,
	);

	testServiceFindByFilter<TemplateEntity, TemplateQuery, TemplateValidator>(
		mockTemplate.query,
		serviceTemplate,
		templateOutputPayloads.find,
	);

	testServiceDelete<TemplateEntity, TemplateQuery>(
		mockTemplate.query,
		serviceTemplate,
	);
	testServiceRestore<TemplateEntity, TemplateQuery>(
		mockTemplate.query,
		serviceTemplate,
	);

	it('should find by label, language, type', async () => {
		const entity = getTemplateEntityMock();
		mockTemplate.query.firstOrFail.mockResolvedValue(entity);

		const result = await serviceTemplate.findByLabel(
			'email-welcome',
			'en',
			entity.type,
			false,
		);

		expect(mockTemplate.query.filterBy).toHaveBeenCalledWith(
			'label',
			'email-welcome',
		);
		expect(mockTemplate.query.filterBy).toHaveBeenCalledWith(
			'language',
			'en',
		);
		expect(result).toBe(entity);
	});
});
