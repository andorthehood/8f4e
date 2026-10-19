import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { chromium } from 'playwright';
import sharp from 'sharp';

import { startPreviewServer } from './server';

export const PROJECT_PREVIEW_FORMATS = ['icon'] as const;
export type ProjectPreviewFormat = (typeof PROJECT_PREVIEW_FORMATS)[number];

export const ICON_PREVIEW_SIZE = 64;

export interface GenerateProjectPreviewOptions {
	/** Preview layout to render. The initial icon format is a 64x64 GIF. */
	format: ProjectPreviewFormat;
	/** Path to an 8f4e project source file. */
	inputPath: string;
	/** Destination path for the generated GIF. */
	outputPath: string;
	/** Maximum time to wait for the editor to load and render the project. */
	timeoutMs?: number;
}

interface PreviewCodeBlock {
	isHome: boolean;
	x: number;
	y: number;
}

interface PreviewState {
	codeBlockRendering: {
		codeBlocks: PreviewCodeBlock[];
		rootCodeBlocks: PreviewCodeBlock[];
		selectedCodeBlock?: PreviewCodeBlock;
	};
	dialogStack: unknown[];
	featureFlags: {
		modeOverlay: boolean;
		offscreenBlockArrows: boolean;
	};
	initialProjectState?: unknown;
	spriteLookups?: unknown;
	viewport: {
		x: number;
		y: number;
	};
	viewportAnimation: {
		active: boolean;
	};
}

interface PreviewWindow {
	requestAnimationFrame: (callback: () => void) => number;
	state?: PreviewState;
}

function resolveEditorAssetsPath(): string {
	const require = createRequire(import.meta.url);
	const editorPackagePath = require.resolve('@8f4e/editor-website/package.json');
	return path.join(path.dirname(editorPackagePath), 'dist');
}

async function validatePaths(inputPath: string, outputPath: string, editorAssetsPath: string): Promise<void> {
	if (path.extname(inputPath) !== '.8f4e') {
		throw new Error(`Project input must be an .8f4e file: ${inputPath}`);
	}

	const inputStat = await fs.stat(inputPath).catch(() => undefined);
	if (!inputStat?.isFile()) {
		throw new Error(`Project input does not exist or is not a file: ${inputPath}`);
	}

	if (path.extname(outputPath).toLowerCase() !== '.gif') {
		throw new Error(`Preview output must be a .gif file: ${outputPath}`);
	}

	const editorEntryPoint = path.join(editorAssetsPath, 'index.html');
	const editorStat = await fs.stat(editorEntryPoint).catch(() => undefined);
	if (!editorStat?.isFile()) {
		throw new Error(
			`Editor website build not found at ${editorEntryPoint}. Build @8f4e/editor-website before generating previews.`
		);
	}
}

async function writePreviewImage(png: Buffer, outputPath: string): Promise<void> {
	await sharp(png)
		.gif({
			colours: 256,
			dither: 0,
			effort: 10,
			reuse: false,
		})
		.toFile(outputPath);
}

/**
 * Generates a deterministic project preview with the production editor renderer.
 *
 * The icon format places the first valid `@home` code block, or the first root
 * code block, at the canvas origin and captures the first 64 by 64 pixels.
 */
export async function generateProjectPreview({
	format,
	inputPath,
	outputPath,
	timeoutMs = 15_000,
}: GenerateProjectPreviewOptions): Promise<void> {
	if (format !== 'icon') {
		throw new Error(`Unsupported preview format: ${format as string}`);
	}

	const resolvedInputPath = path.resolve(inputPath);
	const resolvedOutputPath = path.resolve(outputPath);
	const editorAssetsPath = resolveEditorAssetsPath();
	await validatePaths(resolvedInputPath, resolvedOutputPath, editorAssetsPath);
	await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });

	const previewServer = await startPreviewServer({
		editorAssetsPath,
		projectPath: resolvedInputPath,
	});
	let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

	try {
		browser = await chromium.launch({ headless: true });
		const page = await browser.newPage({
			deviceScaleFactor: 1,
			viewport: { width: ICON_PREVIEW_SIZE, height: ICON_PREVIEW_SIZE },
		});
		const pageErrors: string[] = [];
		page.on('pageerror', error => pageErrors.push(error.message));

		const projectResponsePromise = page.waitForResponse(
			response => new URL(response.url()).pathname === '/project.8f4e',
			{ timeout: timeoutMs }
		);
		await page.goto(`${previewServer.url}/?projectUrl=${encodeURIComponent('/project.8f4e')}`, {
			waitUntil: 'domcontentloaded',
			timeout: timeoutMs,
		});
		const projectResponse = await projectResponsePromise;
		if (!projectResponse.ok()) {
			throw new Error(`Editor failed to load the project: HTTP ${projectResponse.status()}`);
		}

		try {
			await page.waitForFunction(
				() => {
					const state = (globalThis as unknown as PreviewWindow).state;
					return Boolean(
						state?.spriteLookups && state.initialProjectState && state.codeBlockRendering.rootCodeBlocks.length > 0
					);
				},
				undefined,
				{ timeout: timeoutMs }
			);
		} catch {
			const suffix = pageErrors.length > 0 ? ` Browser error: ${pageErrors.at(-1)}` : '';
			throw new Error(`Project failed to load in the editor.${suffix}`);
		}

		await page.evaluate(async () => {
			const previewWindow = globalThis as unknown as PreviewWindow;
			const state = previewWindow.state;
			const targetBlock =
				state?.codeBlockRendering.rootCodeBlocks.find(block => block.isHome) ??
				state?.codeBlockRendering.rootCodeBlocks[0];
			if (!state || !targetBlock) {
				throw new Error('Preview code block disappeared before capture');
			}

			state.viewportAnimation.active = false;
			state.viewport.x = targetBlock.x;
			state.viewport.y = targetBlock.y;
			state.featureFlags.modeOverlay = false;
			state.featureFlags.offscreenBlockArrows = false;
			state.codeBlockRendering.selectedCodeBlock = undefined;
			state.dialogStack.length = 0;

			await new Promise<void>(resolve => previewWindow.requestAnimationFrame(() => resolve()));
			await new Promise<void>(resolve => previewWindow.requestAnimationFrame(() => resolve()));
		});

		const canvas = page.locator('#glcanvas');
		const renderDeadline = Date.now() + timeoutMs;
		let png: Buffer<ArrayBufferLike> = Buffer.alloc(0);
		while (Date.now() < renderDeadline) {
			png = await canvas.screenshot({ type: 'png' });
			const stats = await sharp(png).stats();
			if (stats.channels.some(channel => channel.stdev > 0)) {
				break;
			}
			await page.waitForTimeout(50);
		}
		if (png.length === 0 || !(await sharp(png).stats()).channels.some(channel => channel.stdev > 0)) {
			throw new Error('Project preview did not render visible content before the timeout.');
		}
		await writePreviewImage(png, resolvedOutputPath);
	} finally {
		try {
			await browser?.close();
		} finally {
			await previewServer.close();
		}
	}
}
