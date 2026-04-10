#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createServer } from './server';

async function run(): Promise<void> {
	const server = await createServer(process.argv.slice(2));
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

run().catch(error => {
	const message =
		error instanceof Error
			? error.message
			: typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
				? error.message
				: String(error);
	console.error(message);
	process.exit(1);
});
