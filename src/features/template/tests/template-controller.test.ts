import { jest } from '@jest/globals';
import type TemplateEntity from '@/features/template/template.entity';
import {
	getTemplateEntityMock,
	templateInputPayloads,
} from '@/features/template/template.mock';
import { templatePolicy } from '@/features/template/template.policy';
import templateRoutes from '@/features/template/template.routes';
import { templateService } from '@/features/template/template.service';
import type { TemplateValidator } from '@/features/template/template.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerUpdate,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'TemplateController';
const basePath = (await templateRoutes()).basePath;

testControllerCreate<TemplateEntity, TemplateValidator>({
	controller: controller,
	route: basePath,
	entityMock: getTemplateEntityMock(),
	policy: templatePolicy,
	service: templateService,
	createData: templateInputPayloads.create,
});

testControllerUpdate<TemplateEntity, TemplateValidator>({
	controller: controller,
	route: `${basePath}/${getTemplateEntityMock().id}`,
	entityMock: getTemplateEntityMock(),
	policy: templatePolicy,
	service: templateService,
	updateData: templateInputPayloads.update,
});

testControllerRead<TemplateEntity>({
	controller: controller,
	route: `${basePath}/${getTemplateEntityMock().id}`,
	entityMock: getTemplateEntityMock(),
	policy: templatePolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getTemplateEntityMock().id}`,
	policy: templatePolicy,
	service: templateService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getTemplateEntityMock().id}/restore`,
	policy: templatePolicy,
	service: templateService,
});

testControllerFind<TemplateEntity, TemplateValidator>({
	controller: controller,
	route: basePath,
	entityMock: getTemplateEntityMock(),
	policy: templatePolicy,
	service: templateService,
	findData: templateInputPayloads.find,
});
