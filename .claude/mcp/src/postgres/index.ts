import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { describeError, errorResult, jsonResult } from '../shared/result.js';
import { runEntrypoint, startStdioServer } from '../shared/stdio.js';
import { assessDanger, closePool, runReadOnly, runWrite } from './db.js';

const DEFAULT_MAX_ROWS = 200;
const IGNORED_SCHEMAS = ['pg_catalog', 'information_schema'];

const server = new McpServer({ name: 'pg-mcp', version: '1.0.0' });

server.registerTool(
	'pg_query',
	{
		title: 'Run a read-only query',
		description:
			'Execute a read-only SQL query (SELECT / EXPLAIN / WITH). Runs inside a READ ONLY transaction — writes are rejected by Postgres. Use $1, $2… placeholders with `params` for any user-supplied values; never string-concatenate them.',
		inputSchema: {
			sql: z
				.string()
				.min(1)
				.describe('SQL to run. Parameterize with $1, $2…'),
			params: z
				.array(z.unknown())
				.optional()
				.describe('Ordered values bound to $1, $2…'),
			maxRows: z
				.number()
				.int()
				.positive()
				.optional()
				.describe(
					`Row cap for the response (default ${DEFAULT_MAX_ROWS}).`,
				),
		},
	},
	async ({ sql, params, maxRows }) => {
		try {
			const result = await runReadOnly(sql, params);
			const cap = maxRows ?? DEFAULT_MAX_ROWS;
			const rows = result.rows.slice(0, cap);

			return jsonResult({
				rowCount: result.rowCount,
				returned: rows.length,
				truncated: result.rows.length > cap,
				rows,
			});
		} catch (error) {
			return errorResult(`Query failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'pg_execute',
	{
		title: 'Run a write / DDL statement (gated)',
		description:
			'Execute a write statement (INSERT / UPDATE / DELETE / DDL) in a transaction that commits on success and rolls back on error. High-risk statements (DROP/TRUNCATE/ALTER, or UPDATE/DELETE without WHERE) are refused unless `allowDestructive: true` is passed. Always parameterize user input with $1, $2….',
		inputSchema: {
			sql: z
				.string()
				.min(1)
				.describe('SQL to run. Parameterize with $1, $2…'),
			params: z
				.array(z.unknown())
				.optional()
				.describe('Ordered values bound to $1, $2…'),
			allowDestructive: z
				.boolean()
				.optional()
				.describe('Required to run a statement flagged as high-risk.'),
		},
	},
	async ({ sql, params, allowDestructive }) => {
		const danger = assessDanger(sql);

		if (danger && allowDestructive !== true) {
			return errorResult(
				`Refused: ${danger}. Review the impact, then re-run with allowDestructive: true to proceed.`,
			);
		}

		try {
			const result = await runWrite(sql, params);

			return jsonResult({
				command: result.command,
				rowCount: result.rowCount,
				rows: result.rows,
			});
		} catch (error) {
			return errorResult(`Execution failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'pg_list_tables',
	{
		title: 'List tables',
		description:
			'List base tables, optionally filtered to a single schema. Excludes system schemas.',
		inputSchema: {
			schema: z
				.string()
				.optional()
				.describe('Restrict to one schema (e.g. "public", "system").'),
		},
	},
	async ({ schema }) => {
		try {
			const result = await runReadOnly(
				`SELECT table_schema, table_name
				 FROM information_schema.tables
				 WHERE table_type = 'BASE TABLE'
				   AND table_schema <> ALL($1)
				   AND ($2::text IS NULL OR table_schema = $2)
				 ORDER BY table_schema, table_name`,
				[IGNORED_SCHEMAS, schema ?? null],
			);

			return jsonResult(result.rows);
		} catch (error) {
			return errorResult(`List tables failed: ${describeError(error)}`);
		}
	},
);

server.registerTool(
	'pg_describe_table',
	{
		title: 'Describe a table',
		description:
			'Return a table’s columns, indexes, and constraints (primary key, foreign keys, unique, check).',
		inputSchema: {
			table: z.string().min(1).describe('Table name (unqualified).'),
			schema: z
				.string()
				.optional()
				.describe('Schema name (defaults to "public").'),
		},
	},
	async ({ table, schema }) => {
		const targetSchema = schema ?? 'public';

		try {
			const columns = await runReadOnly(
				`SELECT column_name, data_type, is_nullable, column_default,
				        character_maximum_length
				 FROM information_schema.columns
				 WHERE table_schema = $1 AND table_name = $2
				 ORDER BY ordinal_position`,
				[targetSchema, table],
			);

			if (columns.rowCount === 0) {
				return errorResult(
					`No table "${targetSchema}.${table}" found (or no columns visible).`,
				);
			}

			const indexes = await runReadOnly(
				`SELECT indexname, indexdef
				 FROM pg_indexes
				 WHERE schemaname = $1 AND tablename = $2
				 ORDER BY indexname`,
				[targetSchema, table],
			);

			const constraints = await runReadOnly(
				`SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
				 FROM information_schema.table_constraints tc
				 LEFT JOIN information_schema.key_column_usage kcu
				   ON tc.constraint_name = kcu.constraint_name
				   AND tc.table_schema = kcu.table_schema
				 WHERE tc.table_schema = $1 AND tc.table_name = $2
				 ORDER BY tc.constraint_type, kcu.ordinal_position`,
				[targetSchema, table],
			);

			return jsonResult({
				table: `${targetSchema}.${table}`,
				columns: columns.rows,
				indexes: indexes.rows,
				constraints: constraints.rows,
			});
		} catch (error) {
			return errorResult(
				`Describe table failed: ${describeError(error)}`,
			);
		}
	},
);

server.registerTool(
	'pg_list_schemas',
	{
		title: 'List schemas',
		description: 'List user schemas (excludes system schemas).',
		inputSchema: {},
	},
	async () => {
		try {
			const result = await runReadOnly(
				`SELECT schema_name
				 FROM information_schema.schemata
				 WHERE schema_name <> ALL($1)
				   AND schema_name NOT LIKE 'pg_%'
				 ORDER BY schema_name`,
				[IGNORED_SCHEMAS],
			);

			return jsonResult(result.rows.map((row) => row.schema_name));
		} catch (error) {
			return errorResult(`List schemas failed: ${describeError(error)}`);
		}
	},
);

runEntrypoint('pg-mcp', () => startStdioServer(server, 'pg-mcp', closePool));
