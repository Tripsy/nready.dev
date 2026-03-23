import { jest } from '@jest/globals';
import type CronHistoryEntity from '@/features/cron-history/cron-history.entity';
import {
	cronHistoryInputPayloads,
	getCronHistoryEntityMock,
} from '@/features/cron-history/cron-history.mock';
import { cronHistoryPolicy } from '@/features/cron-history/cron-history.policy';
import cronHistoryRoutes from '@/features/cron-history/cron-history.routes';
import { cronHistoryService } from '@/features/cron-history/cron-history.service';
import type { CronHistoryValidator } from '@/features/cron-history/cron-history.validator';
import {
	testControllerDeleteMultiple,
	testControllerFind,
	testControllerRead,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'CronHistoryController';
const basePath = cronHistoryRoutes.basePath;

testControllerRead<CronHistoryEntity>({
	controller: controller,
	route: `${basePath}/${getCronHistoryEntityMock().id}`,
	entityMock: getCronHistoryEntityMock(),
	policy: cronHistoryPolicy,
});

testControllerDeleteMultiple<CronHistoryValidator>({
	controller: controller,
	route: basePath,
	policy: cronHistoryPolicy,
	service: cronHistoryService,
});

testControllerFind<CronHistoryEntity, CronHistoryValidator>({
	controller: controller,
	route: basePath,
	entityMock: getCronHistoryEntityMock(),
	policy: cronHistoryPolicy,
	service: cronHistoryService,
	findData: cronHistoryInputPayloads.find,
});
