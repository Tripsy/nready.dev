import { jest } from '@jest/globals';
import type TermEntity from '@/features/term/term.entity';
import {
	getTermEntityMock,
	termInputPayloads,
} from '@/features/term/term.mock';
import { termPolicy } from '@/features/term/term.policy';
import TermRoutes from '@/features/term/term.routes';
import { termService } from '@/features/term/term.service';
import type { TermValidator } from '@/features/term/term.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerUpdateWithContent,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'TermController';
const basePath = (await TermRoutes()).basePath;

testControllerCreate<TermEntity, TermValidator>({
	controller: controller,
	route: basePath,
	entityMock: getTermEntityMock(),
	policy: termPolicy,
	service: termService,
	createData: termInputPayloads.create,
});

testControllerUpdateWithContent<TermEntity, TermValidator>({
	controller: controller,
	route: `${basePath}/${getTermEntityMock().id}`,
	entityMock: getTermEntityMock(),
	policy: termPolicy,
	service: termService,
	updateData: termInputPayloads.update,
});

testControllerRead<TermEntity>({
	controller: controller,
	route: `${basePath}/${getTermEntityMock().id}`,
	entityMock: getTermEntityMock(),
	policy: termPolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getTermEntityMock().id}`,
	policy: termPolicy,
	service: termService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getTermEntityMock().id}/restore`,
	policy: termPolicy,
	service: termService,
});

testControllerFind<TermEntity, TermValidator>({
	controller: controller,
	route: basePath,
	entityMock: getTermEntityMock(),
	policy: termPolicy,
	service: termService,
	findData: termInputPayloads.find,
});
