import { EventSubscriber } from 'typeorm';
import TemplateEntity from '@/features/template/template.entity';
import SubscriberAbstract from '@/shared/abstracts/subscriber.abstract';

/**
 * Audit only, and entirely the base class's — the three hooks this used to override differed from
 * it in nothing but the cache cleaning, which now lives in `TemplateService`.
 *
 * That move is not a straight lift: a template is read by `label`/`language`/`type` at render time,
 * so an id-keyed clean does not reach the entry the render actually serves, and a rename has to
 * drop the key under the *old* name as well as the new one. `TemplateService.updateData` is where
 * that is handled and why it captures the lookup key before assigning over it.
 *
 * The base's extra `STATUS` entry never fires here: it is guarded on a `status` column, and a
 * template has none.
 */
@EventSubscriber()
export class TemplateSubscriber extends SubscriberAbstract<TemplateEntity> {
	protected readonly Entity = TemplateEntity;

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
