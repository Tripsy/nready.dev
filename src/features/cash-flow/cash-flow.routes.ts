import { CashFlowStatusEnum } from '@/features/cash-flow/cash-flow.entity';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';
import type { FeatureRoutesModule } from '@/shared/types/routes.type';

export default async () => {
	const { cashFlowController } = await import(
		'@/features/cash-flow/cash-flow.controller'
	);

	const config: FeatureRoutesModule<typeof cashFlowController> = {
		basePath: '/cash-flow',
		controller: cashFlowController,
		routes: {
			create: {
				path: '',
				method: 'post',
			},
			read: {
				path: '/:id',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
			update: {
				path: '/:id',
				method: 'put',
				handlers: [validateParamsWhenId('id')],
			},
			delete: {
				path: '/:id',
				method: 'delete',
				handlers: [validateParamsWhenId('id')],
			},
			find: {
				path: '',
				method: 'get',
			},
			statusUpdate: {
				path: '/:id/status/:status',
				method: 'patch',
				handlers: [
					validateParamsWhenId('id'),
					validateParamsWhenEnum({
						status: Object.values(CashFlowStatusEnum),
					}),
				],
			},
			operationalRecords: {
				path: '/operational-records/:id',
				method: 'get',
				handlers: [validateParamsWhenId('id')],
			},
		},
	};

	return config;
};
