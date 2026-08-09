import { EventSubscriber } from 'typeorm';
import ArticleContentEntity from '@/features/article/article-content.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

@EventSubscriber()
export class ArticleContentSubscriber extends SubscriberAbstract<ArticleContentEntity> {
	protected readonly Entity = ArticleContentEntity;

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
