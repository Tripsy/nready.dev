import {
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

export enum OrderDirectionEnum {
	ASC = 'ASC',
	DESC = 'DESC',
}

export type PageMeta = {
	title?: string;
	description?: string;
	keywords?: string;
};

@Entity()
export abstract class EntityAbstract {
	@PrimaryGeneratedColumn({ type: 'int', unsigned: false })
	id!: number;

	@CreateDateColumn({ type: 'timestamp', nullable: false })
	created_at!: Date;

	@UpdateDateColumn({ type: 'timestamp', nullable: true })
	updated_at!: Date | null;

	@DeleteDateColumn({ type: 'timestamp', nullable: true, select: true })
	deleted_at!: Date | null;
}
