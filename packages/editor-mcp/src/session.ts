import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export interface CodeBlockSummary {
	id: string;
	moduleId: string | null;
	blockType: string;
	gridX: number;
	gridY: number;
	lineCount: number;
	isCollapsed: boolean;
	disabled: boolean;
	isHome: boolean;
	isFavorite: boolean;
}

export interface BrowserOptions {
	url: string;
	channel?: 'chrome' | 'chromium';
}

export interface BrowserSession {
	page: Page;
	listCodeBlocks: () => Promise<CodeBlockSummary[]>;
	close: () => Promise<void>;
}

interface EditorWindowState {
	graphicHelper?: {
		codeBlocks?: Array<{
			id?: unknown;
			moduleId?: unknown;
			blockType?: unknown;
			gridX?: unknown;
			gridY?: unknown;
			code?: unknown;
			isCollapsed?: unknown;
			disabled?: unknown;
			isHome?: unknown;
			isFavorite?: unknown;
		}>;
	};
}

declare global {
	interface Window {
		state?: EditorWindowState;
	}
}

async function waitForEditorState(page: Page): Promise<void> {
	await page.waitForFunction(() => {
		const currentWindow = globalThis as Window & typeof globalThis;
		return Array.isArray(currentWindow.state?.graphicHelper?.codeBlocks);
	});
}

export function normalizeCodeBlocks(value: unknown): CodeBlockSummary[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((block): block is Record<string, unknown> => typeof block === 'object' && block !== null)
		.map(block => ({
			id: typeof block.id === 'string' ? block.id : '',
			moduleId: typeof block.moduleId === 'string' ? block.moduleId : null,
			blockType: typeof block.blockType === 'string' ? block.blockType : 'unknown',
			gridX: typeof block.gridX === 'number' ? block.gridX : 0,
			gridY: typeof block.gridY === 'number' ? block.gridY : 0,
			lineCount: Array.isArray(block.code) ? block.code.length : 0,
			isCollapsed: block.isCollapsed === true,
			disabled: block.disabled === true,
			isHome: block.isHome === true,
			isFavorite: block.isFavorite === true,
		}));
}

async function launchBrowser({ url, channel = 'chrome' }: BrowserOptions): Promise<{
	browser: Browser;
	context: BrowserContext;
	page: Page;
}> {
	const browser = await chromium.launch({
		headless: false,
		channel,
	});
	const context = await browser.newContext();
	const page = await context.newPage();
	await page.goto(url, { waitUntil: 'domcontentloaded' });
	await waitForEditorState(page);
	return { browser, context, page };
}

export async function createEditorSession(options: BrowserOptions): Promise<BrowserSession> {
	let browser: Browser | undefined;
	let context: BrowserContext | undefined;
	let page: Page | undefined;

	try {
		const launched = await launchBrowser(options);
		browser = launched.browser;
		context = launched.context;
		page = launched.page;
		const activePage = page;

		return {
			page: activePage,
			listCodeBlocks: async () => {
				const rawBlocks = await activePage.evaluate(() => {
					const currentWindow = globalThis as Window & typeof globalThis;
					return currentWindow.state?.graphicHelper?.codeBlocks ?? [];
				});

				return normalizeCodeBlocks(rawBlocks);
			},
			close: async () => {
				await context?.close();
				await browser?.close();
			},
		};
	} catch (error) {
		await context?.close();
		await browser?.close();
		throw error;
	}
}
