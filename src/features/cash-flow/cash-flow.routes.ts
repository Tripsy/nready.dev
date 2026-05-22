import type { FeatureRoutesModule } from '@/config/routes.setup';
import { cashFlowController } from '@/features/cash-flow/cash-flow.controller';
import { CashFlowStatusEnum } from '@/features/cash-flow/cash-flow.entity';
import { parseFilterMiddleware } from '@/middleware/parse-filter.middleware';
import {
	validateParamsWhenEnum,
	validateParamsWhenId,
} from '@/middleware/validate-params.middleware';

const routesModule: FeatureRoutesModule<typeof cashFlowController> = {
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
			handlers: [parseFilterMiddleware],
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

const routesConfiguration: FeatureRoutesModule<typeof cashFlowController> = {
	...routesModule,
};

export default routesConfiguration;
