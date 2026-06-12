import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import type CashFlowEntity from '@/features/cash-flow/cash-flow.entity';
import {
	type CashFlowCategory,
	CashFlowCategoryEnum,
} from '@/features/cash-flow/cash-flow-category.enum';
import type ClientEntity from '@/features/client/client.entity';
import type UserEntity from '@/features/user/user.entity';
import type VendorEntity from '@/features/vendor/vendor.entity';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';

export const OperationalRecordTypeEnum = {
	CLIENT: 'client',
	VENDOR: 'vendor',
	EMPLOYEE: 'employee',
} as const;

export type OperationalRecordType =
	(typeof OperationalRecordTypeEnum)[keyof typeof OperationalRecordTypeEnum];

export type CashFlowCategoryOperationalRecordOptionsType = {
	required?: OperationalRecordType[];
	optional?: OperationalRecordType[];
};

type CashFlowCategoryOperationalRecordType = Partial<
	Record<CashFlowCategory, CashFlowCategoryOperationalRecordOptionsType>
>;

const CashFlowCategoryOperationalRecord: CashFlowCategoryOperationalRecordType =
	{
		[CashFlowCategoryEnum.CUSTOMER]: {
			required: [OperationalRecordTypeEnum.CLIENT],
			optional: [
				OperationalRecordTypeEnum.EMPLOYEE,
			],
		},
		[CashFlowCategoryEnum.EMPLOYEE_SALARY]: {
			required: [OperationalRecordTypeEnum.EMPLOYEE],
		},
		[CashFlowCategoryEnum.EMPLOYEE_EXPENSE_ADVANCE]: {
			required: [OperationalRecordTypeEnum.EMPLOYEE],
		},
		[CashFlowCategoryEnum.EMPLOYEE_TRAVEL_ALLOWANCE]: {
			required: [OperationalRecordTypeEnum.EMPLOYEE],
		},
		[CashFlowCategoryEnum.VENDOR]: {
			required: [OperationalRecordTypeEnum.VENDOR],
			optional: [
				OperationalRecordTypeEnum.EMPLOYEE,
			],
		},
		[CashFlowCategoryEnum.INSURANCE]: {
			required: [OperationalRecordTypeEnum.VENDOR],
			optional: [
				OperationalRecordTypeEnum.EMPLOYEE,
			],
		},
		[CashFlowCategoryEnum.TAXES]: {
			required: [OperationalRecordTypeEnum.VENDOR],
			optional: [
				OperationalRecordTypeEnum.EMPLOYEE,
			],
		},
	};

export const getOperationalRecordOptions = (
	category: CashFlowCategory,
): CashFlowCategoryOperationalRecordOptionsType | null => {
	return CashFlowCategoryOperationalRecord[category] ?? null;
};

const ENTITY_TABLE_NAME = 'operational_record';

@Entity({
	name: ENTITY_TABLE_NAME,
	schema: 'public',
	comment: 'Store operational records linked with cash flow operations.',
})
@Index(
	'IDX_operational_record_cash_flow_id',
	['cash_flow_id', 'operational_record_type'],
	{ unique: true },
)
@Index('IDX_operational_record_entity_id', [
	'entity_id',
	'operational_record_type',
])
export default class OperationalRecordEntity extends EntityAbstract {
	static readonly NAME: string = ENTITY_TABLE_NAME;
	static readonly HAS_CACHE: boolean = true;

	@Column('int')
	cash_flow_id!: number;

	@Column({
		type: 'enum',
		enum: OperationalRecordTypeEnum,
		nullable: false,
	})
	operational_record_type!: OperationalRecordType;

	@Column('int', { nullable: false })
	entity_id!: number;

	// OTHER
	@Column('text', { nullable: true })
	notes!: string | null;

	// RELATIONS
	@ManyToOne('CashFlowEntity', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'cash_flow_id' })
	cash_flow!: CashFlowEntity;
}

export type OperationalRecordWithRelations = OperationalRecordEntity & {
	[OperationalRecordTypeEnum.CLIENT]?: ClientEntity | null;
	[OperationalRecordTypeEnum.VENDOR]?: VendorEntity | null;
	[OperationalRecordTypeEnum.EMPLOYEE]?: UserEntity | null;
};
