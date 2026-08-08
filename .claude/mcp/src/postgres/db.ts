import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { loadProjectEnv, resolveHost } from '../shared/env.js';

loadProjectEnv();

const pool = new Pool({
	host: resolveHost(process.env.DB_HOST, process.env.MCP_DB_HOST),
	port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	max: 4,
	// Guard against runaway queries holding a connection open.
	statement_timeout: 15_000,
	connectionTimeoutMillis: 5_000,
});

/**
 * Run a query inside a READ ONLY transaction. Postgres rejects any write at the
 * transaction level regardless of the role's grants, so this is a structural
 * guarantee — not just a naming convention.
 */
export const runReadOnly = async <T extends QueryResultRow = QueryResultRow>(
	sql: string,
	params?: readonly unknown[],
): Promise<QueryResult<T>> => {
	const client = await pool.connect();

	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query<T>(sql, params as unknown[]);
		await client.query('ROLLBACK'); // reads need no commit
		return result;
	} catch (error) {
		await client.query('ROLLBACK').catch(() => undefined);
		throw error;
	} finally {
		client.release();
	}
};

/**
 * Run a write/DDL statement inside a normal transaction: COMMIT on success,
 * ROLLBACK on any error so a failed statement never leaves partial state.
 */
export const runWrite = async <T extends QueryResultRow = QueryResultRow>(
	sql: string,
	params?: readonly unknown[],
): Promise<QueryResult<T>> => {
	const client = await pool.connect();

	try {
		await client.query('BEGIN');
		const result = await client.query<T>(sql, params as unknown[]);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK').catch(() => undefined);
		throw error;
	} finally {
		client.release();
	}
};

const DESTRUCTIVE_PATTERN = /\b(drop|truncate|alter)\b/i;
const MUTATION_PATTERN = /\b(update|delete)\b/i;
const WHERE_PATTERN = /\bwhere\b/i;

/**
 * Heuristic defense-in-depth gate matching `.claude/rules/database.md` §6.1.
 * Returns a human-readable reason when a statement is high-risk, else null.
 *
 * This is a coarse text scan (comments/string literals can fool it) — the
 * authoritative approval gate is Claude Code's own tool-permission prompt.
 */
export const assessDanger = (sql: string): string | null => {
	if (DESTRUCTIVE_PATTERN.test(sql)) {
		return 'statement contains DROP / TRUNCATE / ALTER';
	}

	if (MUTATION_PATTERN.test(sql) && !WHERE_PATTERN.test(sql)) {
		return 'UPDATE / DELETE without a WHERE clause (affects every row)';
	}

	return null;
};

export const closePool = async (): Promise<void> => {
	await pool.end();
};
