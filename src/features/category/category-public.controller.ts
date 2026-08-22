import type { Request, Response } from 'express';
import {
	type CategoryService,
	categoryService,
} from '@/features/category/category.service';
import { CategoryValidator } from '@/features/category/category.validator';
import asyncHandler from '@/helpers/async.handler';
import { BaseController } from '@/shared/abstracts/controller.abstract';

/**
 * The anonymous face of the category tree. No policy is consulted anywhere in here — the
 * route is open by design, and what keeps it safe is the *shape* of what it can ask for:
 * `publicFind` has no status or deleted filter, and `findByFilterPublic` pins both. Adding a
 * filter to either that could widen the set is what would break that.
 */
class CategoryPublicController extends BaseController {
	constructor(
		private validator: CategoryValidator,
		private categoryService: CategoryService,
	) {
		super();
	}

	public find = asyncHandler(async (req: Request, res: Response) => {
		const data = this.validate(this.validator.publicFind, req.query, res);

		if (!data.filter.language) {
			data.filter.language = res.locals.language;
		}

		const [entries, total] =
			await this.categoryService.findByFilterPublic(data);

		res.locals.output.data({
			entries: entries,
			pagination: {
				page: data.page,
				limit: data.limit,
				total: total,
			},
			query: data,
		});

		res.json(res.locals.output);
	});
}

export const categoryPublicController = new CategoryPublicController(
	new CategoryValidator('category'),
	categoryService,
);
