import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/** Success payload, pretty-printed as JSON text. */
export const jsonResult = (payload: unknown): CallToolResult => ({
	content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
});

/** Plain-text success (for output that is already human-readable, e.g. INFO). */
export const textResult = (text: string): CallToolResult => ({
	content: [{ type: 'text', text }],
});

/** Tool-level error the model can read and react to. */
export const errorResult = (message: string): CallToolResult => ({
	content: [{ type: 'text', text: message }],
	isError: true,
});

// Surface underlying errors for debugging without leaking connection details.
export const describeError = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);
