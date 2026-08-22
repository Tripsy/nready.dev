import { ComplaintEntityTypeEnum } from '@/features/complaint/complaint.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

/**
 * The target addresses the row, never an id: `UQ_complaint_user` allows one live complaint per
 * reporter per target, so the path plus the authenticated caller names exactly one row — one the
 * caller may write by construction, with no ownership check left to a later step.
 */
export default async () => {
	const { complaintPublicController } = await import(
		'@/features/complaint/complaint-public.controller'
	);

	const targetHandlers = [
		validateParamsWhenId('entity_id'),
		validateParamsWhenEnum({
			entity_type: Object.values(ComplaintEntityTypeEnum),
		}),
	];

	const config: FeatureRoutesModule<typeof complaintPublicController> = {
		basePath: '/public/complaints',
		controller: complaintPublicController,
		routes: {
			create: {
				path: '',
				method: 'post',
			},
			update: {
				path: '/:entity_type/:entity_id',
				method: 'put',
				handlers: targetHandlers,
			},
			delete: {
				path: '/:entity_type/:entity_id',
				method: 'delete',
				handlers: targetHandlers,
			},
			read: {
				path: '/:entity_type/:entity_id',
				method: 'get',
				handlers: targetHandlers,
			},
		},
	};

	return config;
};
