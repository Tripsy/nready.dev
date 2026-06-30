import ImageEntity from '@/features/image/image.entity';
import PolicyAbstract from '@/shared/abstracts/policy.abstract';

export class ImagePolicy extends PolicyAbstract {
	constructor() {
		const entity = ImageEntity.NAME;

		super(entity);
	}
}

export const imagePolicy = new ImagePolicy();
