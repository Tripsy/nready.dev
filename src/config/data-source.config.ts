import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildSrcPath } from '@/helpers';

const filesExtension = process.env.APP_ENV === 'production' ? 'js' : 'ts';

const dataSource = new DataSource({
	type: (process.env.DB_CONNECTION as 'postgres' | 'mariadb') || 'postgres',
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || '3306', 10),
	username: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'sample-node-api',
	synchronize: false,
	logging: false,
	migrationsTableName:
		process.env.DB_CONNECTION === 'postgres'
			? 'system.migrations'
			: 'migrations',
	entities: [buildSrcPath(`features/**/*.entity.${filesExtension}`)],
	migrations: [buildSrcPath(`database/migrations/*.${filesExtension}`)],
	subscribers: [buildSrcPath(`features/**/*.subscriber.${filesExtension}`)],
	poolSize: 10,
});

export default dataSource;
