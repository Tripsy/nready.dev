import { jest } from '@jest/globals';
import type LogDataEntity from '@/features/log-data/log-data.entity';
import {
	getLogDataEntityMock,
	logDataInputPayloads,
} from '@/features/log-data/log-data.mock';
import { logDataPolicy } from '@/features/log-data/log-data.policy';
import logDataRoutes from '@/features/log-data/log-data.routes';
import { logDataService } from '@/features/log-data/log-data.service';
import type { LogDataValidator } from '@/features/log-data/log-data.validator';
import {
	testControllerDeleteMultiple,
	testControllerFind,
	testControllerRead,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'LogDataController';
const basePath = logDataRoutes.basePath;

testControllerRead<LogDataEntity>({
	controller: controller,
	route: `${basePath}/${getLogDataEntityMock().id}`,
	entityMock: getLogDataEntityMock(),
	policy: logDataPolicy,
});

testControllerDeleteMultiple<LogDataValidator>({
	controller: controller,
	route: basePath,
	policy: logDataPolicy,
	service: logDataService,
});

testControllerFind<LogDataEntity, LogDataValidator>({
	controller: controller,
	route: basePath,
	entityMock: getLogDataEntityMock(),
	policy: logDataPolicy,
	service: logDataService,
	findData: logDataInputPayloads.find,
});
