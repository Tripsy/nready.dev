import { jest } from '@jest/globals';
import type MailQueueEntity from '@/features/mail-queue/mail-queue.entity';
import {
	getMailQueueEntityMock,
	mailQueueInputPayloads,
} from '@/features/mail-queue/mail-queue.mock';
import { mailQueuePolicy } from '@/features/mail-queue/mail-queue.policy';
import mailQueueRoutes from '@/features/mail-queue/mail-queue.routes';
import { mailQueueService } from '@/features/mail-queue/mail-queue.service';
import type { MailQueueValidator } from '@/features/mail-queue/mail-queue.validator';
import {
	testControllerDeleteMultiple,
	testControllerFind,
	testControllerRead,
} from '@/tests/jest-controller.setup';

beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'MailQueueController';
const basePath = (await mailQueueRoutes()).basePath;

testControllerRead<MailQueueEntity>({
	controller: controller,
	route: `${basePath}/${getMailQueueEntityMock().id}`,
	entityMock: getMailQueueEntityMock(),
	policy: mailQueuePolicy,
});

testControllerDeleteMultiple<MailQueueValidator>({
	controller: controller,
	route: basePath,
	policy: mailQueuePolicy,
	service: mailQueueService,
});

testControllerFind<MailQueueEntity, MailQueueValidator>({
	controller: controller,
	route: basePath,
	entityMock: getMailQueueEntityMock(),
	policy: mailQueuePolicy,
	service: mailQueueService,
	findData: mailQueueInputPayloads.find,
});
