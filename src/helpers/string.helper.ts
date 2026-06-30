import sanitizeHtml from 'sanitize-html';

/**
 * Replace variables in a string
 * Ex variables: {{key}}, {{Key}}, {{sub_key}}, {{key1}}
 *
 * @param {string} content - The string to replace template variables in
 * @param {Record<string, string>} vars - The template variables to replace
 * @returns {string} - The string with template variables replaced
 */
export function replaceVars(
	content: string,
	vars: Record<string, string> = {},
): string {
	return content.replace(/{{(\w+)}}/g, (_, key) =>
		key in vars ? vars[key] : `{{${key}}}`,
	);
}

/**
 * Sanitize HTML content
 *
 * @param {string} dirtyHtml - The HTML content to sanitize
 * @returns {string} - The sanitized HTML content
 */
export function safeHtml(dirtyHtml: string): string {
	return sanitizeHtml(dirtyHtml, {
		allowedTags: [
			'p',
			'br',
			'strong',
			'em',
			'i',
			'b',
			'u',
			'span',
			'div',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'ul',
			'ol',
			'li',
			'blockquote',
			'code',
			'pre',
			'a',
			'img',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
		],
		allowedAttributes: {
			a: ['href', 'title', 'target'],
			img: ['src', 'alt', 'width', 'height'],
		},
		disallowedTagsMode: 'discard',
		allowedSchemes: ['http', 'https', 'mailto'],
		allowProtocolRelative: false,
	});
}

/**
 * Convert a string to kebab-case
 *
 * toKebabCase("hello world")           // "hello-world"
 * toKebabCase("HelloWorld")             // "hello-world"
 * toKebabCase("helloWorld")             // "hello-world"
 * toKebabCase("hello_world")            // "hello_world"
 * toKebabCase("hello__world")           // "hello__world"
 * toKebabCase("Hello World!")           // "hello-world"
 * toKebabCase("myVariableName")         // "my-variable-name"
 * toKebabCase("This is a test")         // "this-is-a-test"
 * toKebabCase("  leading trailing  ")   // "leading-trailing"
 *
 * toKebabCase("hello_world", { preserveUnderscores: false })   // "hello-world"
 * toKebabCase("hello__world", { preserveUnderscores: false })  // "hello-world"
 * toKebabCase("hello_world test", { preserveUnderscores: false }) // "hello-world-test"
 *
 * toKebabCase("HelloWorld", { preserveCase: true })     // "Hello-World" (keeps case)
 * toKebabCase("myXMLParser", { preserveCase: true })    // "my-XML-Parser"
 * toKebabCase("HelloWorld", { preserveCase: true, preserveUnderscores: false }) // "Hello-World"
 */
export function toKebabCase(
	str: string,
	options: {
		preserveCase?: boolean;
		preserveUnderscores?: boolean;
	} = {},
): string {
	const { preserveCase = false, preserveUnderscores = true } = options;

	let result = str;

	// Convert to lowercase unless preserveCase is true
	if (!preserveCase) {
		result = result.toLowerCase();
	}

	// Handle camelCase/PascalCase
	result = result.replace(/([a-z])([A-Z])/g, '$1-$2');

	// Replace spaces and (optionally) underscores with hyphens
	if (preserveUnderscores) {
		result = result.replace(/\s+/g, '-');
	} else {
		result = result.replace(/[\s_]+/g, '-');
	}

	// Remove special characters but keep hyphens and alphanumeric
	result = result.replace(/[^a-zA-Z0-9-]/g, '');

	// Clean up multiple hyphens
	result = result.replace(/-+/g, '-');

	// Remove leading/trailing hyphens
	result = result.replace(/^-+|-+$/g, '');

	return result;
}

/**
 * Convert a string to title case
 * Ex: 'cash-flow' → 'Cash Flow'
 */
export function toTitleCase(str: string): string {
	return str
		.replace(/[_-]/g, ' ')
		.split(' ')
		.map((word) => {
			if (!word) {
				return '';
			}

			// Capitalize the first letter, lowercase the rest
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Convert a string to camelCase (or PascalCase if capitalizeFirst is true)
 * Ex: 'cash-flow' → 'cashFlow'
 * Ex: 'cash-flow' with capitalizeFirst: true → 'CashFlow'
 */
export function toCamelCase(
	str: string,
	options: { capitalizeFirst?: boolean } = {},
): string {
	const { capitalizeFirst = false } = options;

	return str
		.replace(/[_-]/g, ' ')
		.split(' ')
		.map((word, index) => {
			if (!word) return '';

			// If capitalizeFirst is true, capitalize even the first word
			if (capitalizeFirst) {
				return (
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
				);
			}

			// Default behavior: first word lowercase, rest capitalized
			return index === 0
				? word.toLowerCase()
				: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join('');
}
