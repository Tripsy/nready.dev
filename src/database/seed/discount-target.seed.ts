import type { EntityManager } from 'typeorm';
import {
	loadIds,
	type SeedDefinition,
	type SeedSummary,
} from '@/database/seed/seed.helper';
import BrandEntity from '@/features/brand/brand.entity';
import CategoryEntity from '@/features/category/category.entity';
import ClientEntity from '@/features/client/client.entity';
import DiscountEntity, {
	type DiscountScope,
	DiscountScopeEnum,
} from '@/features/discount/discount.entity';
import DiscountTargetEntity, {
	type DiscountTargetType,
	DiscountTargetTypeEnum,
} from '@/features/discount/discount-target.entity';

/**
 * Links the seeded discounts to the entities they apply to.
 *
 * Lives in the seed orchestrator rather than in `discount`, so that owning the demo wiring does
 * not hand `discount` a dependency on every catalogue feature it points at. The target table
 * itself is polymorphic and carries no foreign key, so nothing here needs the owning entities
 * except to read real ids.
 *
 * `product`/`variant` targets are skipped: there is no product seed, so there would be nothing
 * to point at.
 */

type LinkPlan = {
	scope: DiscountScope;
	targetType: DiscountTargetType;
	// biome-ignore lint/suspicious/noExplicitAny: three unrelated owner entities
	ownerEntity: new () => any;
	/** Narrows which owners are eligible; categories are a mixed tree of two types. */
	ownerWhere?: Record<string, unknown>;
};

const PLANS: readonly LinkPlan[] = [
	{
		scope: DiscountScopeEnum.CLIENT,
		targetType: DiscountTargetTypeEnum.CLIENT,
		ownerEntity: ClientEntity,
	},
	{
		scope: DiscountScopeEnum.CATEGORY,
		targetType: DiscountTargetTypeEnum.CATEGORY,
		ownerEntity: CategoryEntity,
		// Product categories only — a discount on a blog category would never resolve.
		ownerWhere: { type: 'product' },
	},
	{
		scope: DiscountScopeEnum.BRAND,
		targetType: DiscountTargetTypeEnum.BRAND,
		ownerEntity: BrandEntity,
	},
];

/** Pairs already linked, so a re-run adds nothing twice. */
async function existingPairs(
	manager: EntityManager,
	targetType: DiscountTargetType,
): Promise<Set<string>> {
	const rows = await manager.getRepository(DiscountTargetEntity).find({
		where: { target_type: targetType },
		select: { discount_id: true, entity_id: true },
		withDeleted: true,
	});

	return new Set(rows.map((row) => `${row.discount_id}:${row.entity_id}`));
}

export const discountTargetSeed: SeedDefinition = {
	name: 'discount-target',
	run: async ({ manager }): Promise<SeedSummary> => {
		let inserted = 0;
		let alreadyPresent = 0;
		let target = 0;

		for (const plan of PLANS) {
			const discountIds = await loadIds(manager, DiscountEntity, {
				scope: plan.scope,
			});

			const ownerIds = await loadIds(
				manager,
				plan.ownerEntity,
				plan.ownerWhere ?? {},
			);

			if (discountIds.length === 0 || ownerIds.length === 0) {
				continue;
			}

			const seen = await existingPairs(manager, plan.targetType);

			const rows: Record<string, unknown>[] = [];

			discountIds.forEach((discountId, index) => {
				/*
				 * Two owners per discount, walked round-robin. Enough for the resolver's
				 * "largest wins" path to have something to choose between without pinning the
				 * seed to any particular row.
				 */
				for (let offset = 0; offset < 2; offset++) {
					const ownerId =
						ownerIds[(index * 2 + offset) % ownerIds.length];

					const key = `${discountId}:${ownerId}`;

					target++;

					if (seen.has(key)) {
						alreadyPresent++;
						continue;
					}

					seen.add(key);
					rows.push({
						discount_id: discountId,
						target_type: plan.targetType,
						entity_id: ownerId,
					});
				}
			});

			if (rows.length > 0) {
				await manager
					.getRepository(DiscountTargetEntity)
					.save(rows, { chunk: 50 });

				inserted += rows.length;
			}
		}

		return {
			entity: 'discount-target',
			alreadyPresent,
			inserted,
			target,
			tableTotal: alreadyPresent + inserted,
		};
	},
};
