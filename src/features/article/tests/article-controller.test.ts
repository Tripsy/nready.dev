import { jest } from '@jest/globals';
import type ArticleEntity from '@/features/article/article.entity';
import {
	articleInputPayloads,
	getArticleEntityMock,
} from '@/features/article/article.mock';
import { articlePolicy } from '@/features/article/article.policy';
import articleRoutes from '@/features/article/article.routes';
import { articleService } from '@/features/article/article.service';
import type { ArticleValidator } from '@/features/article/article.validator';
import {
	testControllerCreate,
	testControllerDeleteSingle,
	testControllerFind,
	testControllerRead,
	testControllerRestoreSingle,
	testControllerStatusUpdate,
	testControllerUpdateWithContent,
} from '@/tests/jest-controller.setup';

// No local app: every assertion here comes from the shared builders, which boot their own
beforeEach(() => {
	jest.restoreAllMocks();
});

const controller = 'ArticleController';
const basePath = (await articleRoutes()).basePath;

testControllerCreate<ArticleEntity, ArticleValidator>({
	controller: controller,
	route: basePath,
	entityMock: getArticleEntityMock(),
	policy: articlePolicy,
	service: articleService,
	createData: articleInputPayloads.create,
});

testControllerUpdateWithContent<ArticleEntity, ArticleValidator>({
	controller: controller,
	route: `${basePath}/${getArticleEntityMock().id}`,
	entityMock: getArticleEntityMock(),
	policy: articlePolicy,
	service: articleService,
	updateData: articleInputPayloads.update,
});

testControllerRead<ArticleEntity>({
	controller: controller,
	route: `${basePath}/${getArticleEntityMock().id}`,
	entityMock: getArticleEntityMock(),
	policy: articlePolicy,
});

testControllerDeleteSingle({
	controller: controller,
	route: `${basePath}/${getArticleEntityMock().id}`,
	policy: articlePolicy,
	service: articleService,
});

testControllerRestoreSingle({
	controller: controller,
	route: `${basePath}/${getArticleEntityMock().id}/restore`,
	policy: articlePolicy,
	service: articleService,
});

testControllerFind<ArticleEntity, ArticleValidator>({
	controller: controller,
	route: basePath,
	entityMock: getArticleEntityMock(),
	policy: articlePolicy,
	service: articleService,
	findData: articleInputPayloads.find,
});

testControllerStatusUpdate<ArticleEntity>({
	controller: controller,
	route: `${basePath}/${getArticleEntityMock().id}/status/pending`,
	entityMock: getArticleEntityMock(),
	policy: articlePolicy,
	service: articleService,
});
