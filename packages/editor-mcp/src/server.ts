import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { read8f4eManual } from './manual';
import { createEditorSession, type BrowserOptions, type BrowserSession } from './session';

export type ServerOptions = BrowserOptions;

export function parseArgs(args: string[]): ServerOptions {
	let url = 'https://editor.8f4e.com';
	let channel: BrowserOptions['channel'] = 'chrome';

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === '--url' && args[i + 1]) {
			url = args[i + 1];
			i += 1;
			continue;
		}
		if (arg === '--channel' && args[i + 1]) {
			const value = args[i + 1];
			if (value === 'chrome' || value === 'chromium') {
				channel = value;
			}
			i += 1;
		}
	}

	return { url, channel };
}

export interface SessionStore {
	openSession: () => Promise<string>;
	getSession: (sessionId: string) => Promise<BrowserSession>;
	closeSession: (sessionId: string) => Promise<boolean>;
	closeAll: () => Promise<void>;
}

type JsonToolResult = ReturnType<typeof createJsonToolResult>;
type SessionToolArgs = { sessionId: string };

interface ToolRegistrationConfig {
	description: string;
	inputSchema?: Record<string, z.ZodTypeAny>;
}

interface ToolServer {
	registerTool<TArgs = unknown>(
		name: string,
		config: ToolRegistrationConfig,
		handler: (args: TArgs) => Promise<JsonToolResult>
	): void;
}

const ABOUT_8F4E = [
	'8f4e is a visual, block-based editor and runtime for patching together low-level modules written in the 8f4e language.',
	'Projects are composed of code blocks such as modules, functions, constants, macros, and notes, arranged spatially in the editor.',
	'The editor is used for interactive programming, experimentation, and composition across audio, visuals, MIDI, and other runtime-driven systems.',
	'In this MCP bridge, the AI is intended to act as a copilot around the live editor state rather than as a generic browser automation agent.',
].join(' ');

function createJsonToolResult(payload: Record<string, unknown>) {
	return {
		content: [
			{
				type: 'text' as const,
				text: JSON.stringify(payload, null, 2),
			},
		],
		structuredContent: payload,
	};
}

export function createSessionStore(
	options: ServerOptions,
	sessionFactory: (options: ServerOptions) => Promise<BrowserSession> = createEditorSession
): SessionStore {
	let nextSessionId = 1;
	const sessions = new Map<string, Promise<BrowserSession>>();

	return {
		openSession: async () => {
			const sessionId = `session-${nextSessionId}`;
			nextSessionId += 1;
			const sessionPromise = sessionFactory(options).catch(error => {
				sessions.delete(sessionId);
				throw error;
			});
			sessions.set(sessionId, sessionPromise);
			await sessionPromise;
			return sessionId;
		},
		getSession: async (sessionId: string) => {
			const session = sessions.get(sessionId);
			if (!session) {
				throw new Error(`Unknown editor session: ${sessionId}`);
			}

			return session;
		},
		closeSession: async (sessionId: string) => {
			const session = sessions.get(sessionId);
			if (!session) {
				return false;
			}

			sessions.delete(sessionId);
			const resolvedSession = await session;
			await resolvedSession.close();
			return true;
		},
		closeAll: async () => {
			const pendingSessions = Array.from(sessions.values());
			sessions.clear();
			const resolvedSessions = await Promise.all(pendingSessions);
			await Promise.all(resolvedSessions.map(session => session.close()));
		},
	};
}

export async function createServer(args: string[] = []): Promise<McpServer> {
	const options = parseArgs(args);
	const sessionStore = createSessionStore(options);
	const server = new McpServer({
		name: '8f4e-editor-mcp',
		version: '0.1.0',
	});
	const toolServer = server as unknown as ToolServer;
	const listCodeBlocksHandler = async (args: SessionToolArgs): Promise<JsonToolResult> => {
		const { sessionId } = args;
		const session = await sessionStore.getSession(sessionId);
		const blocks = await session.listCodeBlocks();
		return createJsonToolResult({
			sessionId,
			url: options.url,
			total: blocks.length,
			blocks,
		});
	};
	const closeEditorSessionHandler = async (args: SessionToolArgs): Promise<JsonToolResult> => {
		const { sessionId } = args;
		const closed = await sessionStore.closeSession(sessionId);
		return createJsonToolResult({
			sessionId,
			closed,
		});
	};

	toolServer.registerTool(
		'explain_8f4e',
		{
			description: 'Explain what 8f4e is and how this MCP bridge should be used by AI agents.',
		},
		async () => {
			return createJsonToolResult({
				name: '8f4e',
				description: ABOUT_8F4E,
				guidance: [
					'Treat 8f4e as a live visual programming editor whose primary entities are code blocks.',
					'Use session tools to inspect the currently open editor state after the user loads or opens a project.',
					'Prefer editor-specific tools over generic browser reasoning.',
				],
			});
		}
	);

	toolServer.registerTool(
		'get_8f4e_manual',
		{
			description:
				'Return the 8f4e programming manual, including language overview, instruction index, comments, identifier prefixes, and editor directives.',
		},
		async () => {
			const manual = await read8f4eManual();
			return createJsonToolResult(manual as unknown as Record<string, unknown>);
		}
	);

	toolServer.registerTool(
		'open_editor_session',
		{
			description: 'Open a visible Chrome session for the 8f4e editor and return its session id.',
		},
		async () => {
			const sessionId = await sessionStore.openSession();
			return createJsonToolResult({
				sessionId,
				url: options.url,
			});
		}
	);

	toolServer.registerTool(
		'list_code_blocks',
		{
			description: 'List the current code blocks from a previously opened 8f4e editor session.',
			inputSchema: {
				sessionId: z.string(),
			},
		},
		listCodeBlocksHandler
	);

	toolServer.registerTool(
		'close_editor_session',
		{
			description: 'Close a previously opened 8f4e editor session.',
			inputSchema: {
				sessionId: z.string(),
			},
		},
		closeEditorSessionHandler
	);

	server.server.onclose = async () => {
		await sessionStore.closeAll();
	};

	return server;
}
