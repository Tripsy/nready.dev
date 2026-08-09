import { EventSubscriber } from 'typeorm';
import ArticleEntity from '@/features/article/article.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ArticleSubscriber extends SubscriberAbstract<ArticleEntity> {
	protected readonly Entity = ArticleEntity;

	constructor() {
		super();

		this.config = {
			afterInsert: true,
			afterUpdate: true,
			beforeRemove: true,
			afterSoftRemove: true,
		};
	}
}
