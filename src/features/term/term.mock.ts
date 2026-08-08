import type TermEntity from '@/features/term/term.entity';
import { TermTypeEnum } from '@/features/term/term.entity';
import { OrderByEnum, TermValidator } from '@/features/term/term.validator';
import { createPastDate } from '@/helpers/date.helper';
import { OrderDirectionEnum } from '@/shared/abstracts/entity.abstract';

const termValidator = new TermValidator('term');

export function getTermEntityMock(): TermEntity {
	return {
		id: 1,
		type: TermTypeEnum.TAG,
		language: 'en',
		value: 'Summer',
		details: null,
		created_at: createPastDate(28800),
		updated_at: null,
		deleted_at: null,
	};
}

export const termInputPayloads = {
	create: {
		type: TermTypeEnum.TAG,
		language: 'en',
		value: 'Summer',
	},
	update: {
		id: 1,
		type: TermTypeEnum.TAG,
		language: 'en',
		value: 'Summer Update',
	},
	find: {
		page: 1,
		limit: 10,
		order_by: OrderByEnum.ID,
		direction: OrderDirectionEnum.DESC,
		filter: {
			type: TermTypeEnum.TAG,
			language: 'en',
			term: 'test',
			is_deleted: true,
		},
	},
};

export const termOutputPayloads = {
	create: termValidator.create.parse(termInputPayloads.create),
	update: termValidator.update.parse(termInputPayloads.update),
	find: termValidator.find.parse(termInputPayloads.find),
};
