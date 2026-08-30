import { getLogHistoryEntityMock } from '@/features/log-history/log-history.mock';
import type { statsController } from '@/features/stats/stats.controller';
import { PENDING_REVIEW_ENTITIES } from '@/features/stats/stats.service';
import {
	type ApiInputDocumentation,
	helperApiInputDocumentation,
} from '@/helpers/api-documentation.helper';

/**
 * The figures behind the dashboard's landing page. Every action is a read with no input, and
 * every one is admin-only: they aggregate across features, so there is no single permission
 * entity that could scope them and holding `read` on one feature does not buy a slice here.
 *
 * The numbers are whatever the last cache fill saw, so two tiles can disagree by up to the
 * cache lifetime. Each response carries `meta.isCached` saying which of the two it was, and
 * nothing invalidates these keys — a figure catches up when its entry lapses, not when the
 * underlying row changes.
 *
 * This feature is the one part of the API a project is expected to rewrite rather than reuse:
 * the figures name the features this particular product cares about.
 */

const cacheNote =
	'Cached; `meta.isCached` is true when the response came from the cache rather than the database';

export const docs: Record<keyof typeof statsController, ApiInputDocumentation> =
	{
		recentActivity: helperApiInputDocumentation({
			description: 'Get the latest entries of the history log',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Recent activity list',
				dataSample: [getLogHistoryEntityMock()] as unknown as Record<
					string,
					unknown
				>,
			},
			withAuthErrors: true,
			request: {
				notes: `\`data\` is the bare array, newest first and capped — it is a panel, not a paged list; \`GET /log-history\` is the endpoint to page through. ${cacheNote}`,
			},
		}),
		recentCounts: helperApiInputDocumentation({
			description: 'Count what each feature gained in the last day',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Recent counts',
				dataSample: {
					user: 3,
					client: 1,
					article: 4,
					comment: 12,
					complaint: 0,
				},
			},
			withAuthErrors: true,
			request: {
				notes: `A rolling 24 hours ending now, not the calendar day, so the same request an hour later covers a different window. Soft-deleted rows are left out: something created and then deleted inside the window is not something to point at. ${cacheNote}`,
			},
		}),
		pendingReview: helperApiInputDocumentation({
			description: 'Get the moderation backlog of every feature',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Pending review queues',
				dataSample: {
					user: {
						entries: [
							{
								id: 7,
								label: 'John Doe',
								created_at: '2026-07-01T09:15:00.000Z',
							},
						],
						total: 3,
					},
					client: { entries: [], total: 0 },
					article: {
						entries: [
							{
								id: 12,
								label: null,
								created_at: '2026-07-01T08:02:00.000Z',
							},
						],
						total: 1,
					},
					comment: { entries: [], total: 0 },
					complaint: { entries: [], total: 0 },
				},
			},
			withAuthErrors: true,
			request: {
				notes: `One group per feature, keyed by ${PENDING_REVIEW_ENTITIES.join(', ')}, each newest first. \`total\` is the real backlog and \`entries\` only its first page, so the two differ once a queue grows past what the panel shows. What counts as waiting differs per feature — a pending status for most, either pending or flagged for a comment, and unresolved for a complaint. \`label\` is the best name the row offers cheaply and is null for an article, whose title lives per language in a table this query does not join. ${cacheNote}`,
			},
		}),
		sumExpenses: helperApiInputDocumentation({
			description: 'Get the month-to-date expenses against last month',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Expense total',
				dataSample: {
					value: 12450.32,
					change: -8.4,
					trend: 'down',
				},
			},
			withAuthErrors: true,
			request: {
				notes: `Outgoing cash flow from the first of this month to now, compared against the same span of the previous month, so early in a month both figures are small. Only completed entries count — pending money is not money yet. \`value\` is the positive magnitude in the base currency and \`change\` its percentage against the comparison span, with \`trend\` reading \`up\` on a rise in spending. With nothing in the previous span \`change\` is a flat 100. ${cacheNote}`,
			},
		}),
		sumRevenues: helperApiInputDocumentation({
			description: 'Get the month-to-date revenue against last month',
			withBearerAuth: true,
			success: {
				status: 200,
				description: 'Revenue total',
				dataSample: {
					value: 38210.75,
					change: 12.6,
					trend: 'up',
				},
			},
			withAuthErrors: true,
			request: {
				notes: `Incoming cash flow, on the same spans and the same completed-only rule as \`sum-expenses\`; only the direction differs. ${cacheNote}`,
			},
		}),
	};
