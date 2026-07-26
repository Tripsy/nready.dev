import nunjucks from 'nunjucks';
import { Configuration } from '@/config/settings.config';
import { buildSrcPath, createCurrentDate } from '@/helpers';

// Create a new environment
const templates = new nunjucks.Environment(
	new nunjucks.FileSystemLoader(buildSrcPath('templates')),
	{
		autoescape: true,
		throwOnUndefined: true,
		trimBlocks: true,
		noCache: Configuration.get('app.debug'),
		watch: true,
	},
);

// Add global variables
templates.addGlobal('siteName', Configuration.get('frontend.name'));
templates.addGlobal('siteUrl', Configuration.get('frontend.url'));
templates.addGlobal('supportEmail', Configuration.get('app.email'));
templates.addGlobal(
	'currentYear',
	createCurrentDate().getFullYear().toString(),
);

// // Add custom filter
// templates.addFilter('shorten', function (str: string, count: number = 5) {
//     return str.slice(0, count);
// });

export default templates;
