import { Index } from 'typeorm';

export function SoftDeleteIndex(entityName: string) {
	return Index(`IDX_${entityName}_deleted_at`, ['deleted_at'], {
		where: 'deleted_at IS NULL',
	});
}
