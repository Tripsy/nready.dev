import 'dotenv/config';
import type { Server } from 'node:http';
import { createApp } from '@/app';
import { bootstrap } from '@/bootstrap';
import { redisClose } from '@/config/init-redis.config';
import {
	cleanupWebSockets,
	setupWebSockets,
} from '@/config/init-websocket.setup';
import { getRoutesInfo } from '@/config/routes.setup';
import { Configuration } from '@/config/settings.config';
import { destroyDatabase } from '@/providers/database.provider';
import { getSystemLogger, LogStream } from '@/providers/logger.provider';
import { queueFactory } from '@/queues/queue.factory';

export let server: Server;
let isShuttingDown = false;

const FORCE_SHUTDOWN_TIMEOUT = Number(
	process.env.FORCE_SHUTDOWN_TIMEOUT ?? 10000,
);

async function start() {
	// 1. Infrastructure first
	await bootstrap();

	// 2. Create Express app
	const app = await createApp();

	// 3. Start HTTP server
	const appPort = Number(
		Configuration.isEnvironment('test')
			? Configuration.get('app.port_while_testing') || 3001
			: Configuration.get('app.port'),
	);

	await new Promise<void>((resolve) => {
		server = app.listen(appPort, () => {
			getSystemLogger().info(`Server listening on port ${appPort}`);
			resolve();
		});
	});

	// 4. Setup WebSockets
	await setupWebSockets(server);

	// 5. Setup signal handlers
	setupSignalHandlers();

	// 6. Print startup banner
	printStartupInfo();
}

start().catch((error) => {
	console.error(error);

	// Logger can also generate errors (e.g: DB related, etc.), there is no error throw from here, just check alternative logs
	getSystemLogger().fatal(error, 'Application startup failed');

	process.exit(1);
});

function setupSignalHandlers() {
	process.on('SIGINT', () => shutdown('SIGINT'));
	process.on('SIGTERM', () => shutdown('SIGTERM'));

	process.on('uncaughtException', (error) => {
		getSystemLogger().fatal(error, 'Uncaught exception');
		shutdown('uncaughtException').then((r) => console.error(r));
	});

	process.on('unhandledRejection', (reason) => {
		getSystemLogger().fatal(reason, 'Unhandled rejection');
		shutdown('unhandledRejection').then((r) => console.error(r));
	});
}

async function shutdown(signal: string): Promise<void> {
	if (isShuttingDown) {
		return;
	}

	isShuttingDown = true;

	getSystemLogger().debug(
		`${signal} signal received. Starting graceful shutdown...`,
	);

	if (!server) {
		getSystemLogger().debug('No server instance to close');

		process.exit(0);
	}

	server.close(() => {
		closeHandler()
			.then(() => {
				getSystemLogger().debug('Shutdown complete');
				process.exit(0);
			})
			.catch((err) => {
				getSystemLogger().fatal(err, 'Shutdown error');
				process.exit(1);
			});
	});

	setTimeout(() => {
		getSystemLogger().fatal(
			`Forcing shutdown after ${FORCE_SHUTDOWN_TIMEOUT}ms`,
		);
		process.exit(1);
	}, FORCE_SHUTDOWN_TIMEOUT).unref();
}

export async function closeHandler(): Promise<void> {
	const closeOperations = [
		{ name: 'Redis', fn: redisClose },
		{ name: 'Queues', fn: () => queueFactory.closeAll() },
		{ name: 'Database', fn: destroyDatabase },
		{ name: 'Log streams', fn: () => new LogStream().closeFileStreams() },
		{ name: 'WebSockets', fn: () => cleanupWebSockets() },
	];

	await Promise.allSettled(
		closeOperations.map(async ({ name, fn }) => {
			try {
				await fn();

				getSystemLogger().debug(`${name} closed successfully`);
			} catch (error) {
				getSystemLogger().warn(error, `${name} close warning`);
			}
		}),
	);
}

// Print startup info
function printStartupInfo(): void {
	const appConfig = {
		port: Configuration.get('app.port') as string,
		environment: Configuration.environment() as string,
		name: Configuration.get('app.name') as string,
		url: Configuration.get('app.url') as string,
	};

	if (appConfig.environment === 'test') {
		return;
	}

	const width = 60;
	const lines = [
		['Environment:', appConfig.environment],
		['Port:', appConfig.port],
		['URL:', `${appConfig.url}:${appConfig.port}`],
		['Health:', `${appConfig.url}:${appConfig.port}/health`],
	];

	console.debug(`┌${'─'.repeat(width + 2)}┐`);
	console.debug(`│ ${appConfig.name.padEnd(width)} │`);
	console.debug(`├${'─'.repeat(width + 2)}┤`);

	for (const [label, value] of lines) {
		const text = `${label} ${value}`.padEnd(width);
		console.debug(`│ ${text} │`);
	}

	// Display routes
	if (appConfig.environment === 'development') {
		const routes = getRoutesInfo();

		if (routes.length > 0) {
			console.debug(`├${'─'.repeat(width + 2)}┤`);
			console.debug(
				`│ ${`Routes (${routes.length} total):`.padEnd(width)} │`,
			);
			console.debug(`│${' '.repeat(width + 2)}│`);

			routes.forEach((route) => {
				console.debug(
					`│ ${route.method.padEnd(7)} ${route.path.padEnd(width - 8)} │`,
				);
			});
		}
	}

	console.debug(`└${'─'.repeat(width + 2)}┘`);
}
