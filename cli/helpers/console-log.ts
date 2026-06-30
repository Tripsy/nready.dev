import fs from 'node:fs/promises';
import { createCurrentDate } from '../../src/helpers';

export async function logToFile(message: string, filePath: string) {
	const timestamp = createCurrentDate()
		.toISOString()
		.replace('T', ' ')
		.substring(0, 19);

	const logEntry = `${timestamp} ${message}\n`;

	await fs.appendFile(filePath, logEntry);
}
