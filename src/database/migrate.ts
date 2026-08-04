import 'reflect-metadata';
import 'dotenv/config';
import dataSource from '@/config/data-source.config';

/**
 * Runs pending migrations. This is the production entry point — `pnpm run migration:run`
 * drives the TypeORM CLI through `tsx`, and neither is present in the production image.
 *
 * Compiled to `dist/src/database/migrate.js` and invoked as a one-shot container before the
 * app starts, so a release never serves traffic against a schema it does not expect.
 */

/**
 * Creates the non-public schemas the entities and the migrations table live in.
 *
 * This cannot be done inside a migration. TypeORM creates its bookkeeping table — here
 * `system.migrations` — *before* it runs anything, so on an empty database it fails with
 * `schema "system" does not exist` and no migration ever executes.
 *
 * The schema list is derived from entity metadata rather than hard-coded, so adding a
 * feature in a new schema does not silently reintroduce the same bootstrap failure.
 */
async function ensureSchemas(): Promise<void> {
	const schemas = new Set<string>();

	for (const metadata of dataSource.entityMetadatas) {
		if (metadata.schema) {
			schemas.add(metadata.schema);
		}
	}

	// `migrationsTableName` may itself be schema-qualified ("system.migrations"), and that
	// schema is needed before anything else.
	const migrationsTable = dataSource.options.migrationsTableName;

	if (migrationsTable?.includes('.')) {
		schemas.add(migrationsTable.split('.')[0]);
	}

	for (const schema of schemas) {
		// Identifier is quoted rather than parameterised: CREATE SCHEMA takes no bind
		// parameters. The values come from entity metadata in this repo, not from input.
		await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
	}

	if (schemas.size > 0) {
		console.log(`Schemas ensured: ${[...schemas].sort().join(', ')}`);
	}
}

async function run(): Promise<void> {
	// `migrations` are read from the configured glob, so an empty run is a valid outcome —
	// it means the database is already current.
	await dataSource.initialize();

	try {
		await ensureSchemas();

		const executed = await dataSource.runMigrations({
			transaction: 'each',
		});

		if (executed.length === 0) {
			console.log('No pending migrations.');
		} else {
			for (const migration of executed) {
				console.log(`Applied: ${migration.name}`);
			}
		}
	} finally {
		// In a finally block so a failed migration still releases the pool and lets the
		// container exit, rather than hanging until the deploy times out.
		await dataSource.destroy();
	}
}

run()
	.then(() => {
		/*
		 * Exits explicitly rather than letting the event loop drain.
		 *
		 * Initialising the data source loads every entity and subscriber through its globs,
		 * and the subscribers pull in the cache provider — which opens a Redis connection
		 * that ioredis keeps alive with automatic reconnection. Closing the database pool
		 * is not enough: the process would sit there until the deploy timed out, with the
		 * migrations already applied and no indication of what it was waiting for.
		 */
		process.exit(0);
	})
	.catch((error: unknown) => {
		console.error('Migration failed:', error);

		// Non-zero exit is what stops the deploy: the app container must not start against
		// a schema that failed to migrate.
		process.exit(1);
	});
