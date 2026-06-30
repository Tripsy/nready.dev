import {
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

export const OrderDirectionEnum = {
	ASC: 'ASC',
	DESC: 'DESC',
} as const;

export type OrderDirection =
	(typeof OrderDirectionEnum)[keyof typeof OrderDirectionEnum];

export type PageMeta = {
	title?: string;
	description?: string;
	keywords?: string;
};

@Entity()
export abstract class EntityAbstract {
	@PrimaryGeneratedColumn({ type: 'int' })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@DeleteDateColumn({ type: 'timestamp', nullable: true, select: true })
	deleted_at!: Date | null;
}
