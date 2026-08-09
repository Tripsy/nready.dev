import ArticleEntity from '@/features/article/article.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class ArticlePolicy extends PolicyAbstract {
	constructor() {
		const entity = ArticleEntity.NAME;

		super(entity);
	}
}

export const articlePolicy = new ArticlePolicy();
