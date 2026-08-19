import { validateParamsWhenId } from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { complaintController } = await import(
		'@/features/complaint/complaint.controller'
	);

	const config: FeatureRoutesModule<typeof complaintController> = {
		basePath: '/complaints',
		controller: complaintController,
		routes: {
			read: {
				path: '/:id',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
			find: {
				path: '',
				method: 'get',
			},
			/*
			 * One endpoint per direction. The alternative — a single route taking `is_resolved` in
			 * the body — cannot work here: a required boolean is validated as "must be true", so
			 * the reopening half would answer 422 on every call.
			 */
			resolve: {
				path: '/:id/resolve',
				method: 'patch',
				handlers: [validateParamsWhenId('id')],
			},
			reopen: {
				path: '/:id/reopen',
				method: 'patch',
				handlers: [validateParamsWhenId('id')],
			},
			// Soft — a dismissed complaint is still the record a disputed decision is answered
			// from, so `restore` pairs with it.
			delete: {
				path: '/:id',
				method: 'delete',
				handlers: [validateParamsWhenId('id')],
			},
			restore: {
				path: '/:id/restore',
				method: 'patch',
				handlers: [validateParamsWhenId('id')],
			},
		},
	};

	return config;
};
