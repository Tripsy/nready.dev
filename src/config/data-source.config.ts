import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildSrcPath } from '@/helpers/system.helper';

const filesExtension = process.env.APP_ENV === 'production' ? 'js' : 'ts';

const dbConnection: 'postgres' | 'mariadb' =
	(process.env.DB_CONNECTION as 'postgres' | 'mariadb') || 'postgres';
const defaultPort = dbConnection === 'postgres' ? 5432 : 3306;

const dataSource = new DataSource({
	type: dbConnection,
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT || `${defaultPort}`, 10),
	username: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'nready-app',
	synchronize: false,
	logging: false,
	migrationsTableName:
		dbConnection === 'postgres' ? 'system.migrations' : 'migrations',
	entities: [buildSrcPath(`features/**/*.entity.${filesExtension}`)],
	migrations: [buildSrcPath(`database/migrations/*.${filesExtension}`)],
	subscribers: [buildSrcPath(`features/**/*.subscriber.${filesExtension}`)],
	poolSize: 10,
});

export default dataSource;
