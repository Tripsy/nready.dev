export const CashFlowCategoryEnum = {
	// Revenue
	CUSTOMER: 'customer', // When company receive money from customer (invoice based)

	// Operational Expenses
	FUEL: 'fuel', // Vehicle fuel
	MAINTENANCE: 'maintenance', // Vehicle repairs
	TOLLS: 'tolls', // Road tolls

	// Employee
	EMPLOYEE_SALARY: 'employee_salary',
	EMPLOYEE_EXPENSE_ADVANCE: 'employee_advance',
	EMPLOYEE_TRAVEL_ALLOWANCE: 'employee_allowance',

	// Business Expenses
	VENDOR: 'vendor', // Third-party services
	INSURANCE: 'insurance',
	TAXES: 'taxes',

	// Correction
	REFUND: 'refund',
	EMPLOYEE_REIMBURSEMENT: 'employee_reimbursement',
} as const;

export type CashFlowCategory =
	(typeof CashFlowCategoryEnum)[keyof typeof CashFlowCategoryEnum];
