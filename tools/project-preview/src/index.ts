import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import sharp from 'sharp';

import { startPreviewServer } from './server';

export const PROJECT_PREVIEW_FORMATS = ['icon'] as const;
export type ProjectPreviewFormat = (typeof PROJECT_PREVIEW_FORMATS)[number];

export const DEFAULT_PREVIEW_SIZE = 64;
export const ICON_PREVIEW_SIZE = DEFAULT_PREVIEW_SIZE;
export const DEFAULT_PREVIEW_POSITION = { x: 0, y: 0 } as const;
export const DEFAULT_PREVIEW_RUN_FOR_MS = 0;

const AUDIO_PERMISSION_DIALOG_ID = 'audio-worklet-permission';
const AUDIO_PERMISSION_BUTTON_TITLE = 'Allow';

export interface ProjectPreviewPosition {
	/** Horizontal distance between the image's left edge and the code block's left edge. */
	x: number;
	/** Vertical distance between the image's top edge and the code block's top edge. */
	y: number;
}

export interface GenerateProjectPreviewOptions {
	/** Preview layout to render. */
	format: ProjectPreviewFormat;
	/** Path to an 8f4e project source file. */
	inputPath: string;
	/** Destination path for the generated GIF. */
	outputPath: string;
	/** Distance between the preview edges and the target code block. */
	position?: ProjectPreviewPosition;
	/** Start an audio runtime and wait this many milliseconds before capture. */
	runForMs?: number;
	/** Width and height of the square output image in pixels. */
	size?: number;
	/** Maximum time to wait for the editor to load and render the project. */
	timeoutMs?: number;
}

interface PreviewCodeBlock {
	isHome: boolean;
	x: number;
	y: number;
}

interface PreviewDialogButton {
	height: number;
	title: string;
	width: number;
	x: number;
	y: number;
}

interface PreviewState {
	codeBlockRendering: {
		codeBlocks: PreviewCodeBlock[];
		rootCodeBlocks: PreviewCodeBlock[];
		selectedCodeBlock?: PreviewCodeBlock;
	};
	dialog: {
		buttons: PreviewDialogButton[];
		id: string;
		x: number;
		y: number;
	};
	dialogStack: Array<{ id: string }>;
	featureFlags: {
		modeOverlay: boolean;
		offscreenBlockArrows: boolean;
	};
	initialProjectState?: unknown;
	spriteLookups?: unknown;
	viewport: {
		height: number;
		width: number;
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
	const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	return path.resolve(packageRoot, '../../packages/editor/packages/editor-website/dist');
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

function validateRenderOptions(size: number, position: ProjectPreviewPosition, runForMs: number): void {
	if (!Number.isSafeInteger(size) || size <= 0) {
		throw new Error(`Preview size must be a positive integer: ${size}`);
	}
	if (!Number.isSafeInteger(position.x) || !Number.isSafeInteger(position.y)) {
		throw new Error(`Preview position offsets must be integers: ${position.x}, ${position.y}`);
	}
	if (!Number.isSafeInteger(runForMs) || runForMs < 0) {
		throw new Error(`Preview run duration must be a non-negative integer: ${runForMs}`);
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
 * code block, at the configured position and captures a square image.
 */
export async function generateProjectPreview({
	format,
	inputPath,
	outputPath,
	position = DEFAULT_PREVIEW_POSITION,
	runForMs = DEFAULT_PREVIEW_RUN_FOR_MS,
	size = DEFAULT_PREVIEW_SIZE,
	timeoutMs = 15_000,
}: GenerateProjectPreviewOptions): Promise<void> {
	if (format !== 'icon') {
		throw new Error(`Unsupported preview format: ${format as string}`);
	}

	const resolvedInputPath = path.resolve(inputPath);
	const resolvedOutputPath = path.resolve(outputPath);
	const editorAssetsPath = resolveEditorAssetsPath();
	validateRenderOptions(size, position, runForMs);
	await validatePaths(resolvedInputPath, resolvedOutputPath, editorAssetsPath);
	await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });

	const previewServer = await startPreviewServer({
		editorAssetsPath,
		projectPath: resolvedInputPath,
	});
	let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

	try {
		browser = await chromium.launch({ headless: true });
		const initialViewport =
			runForMs > 0 ? { width: Math.max(size, 640), height: Math.max(size, 480) } : { width: size, height: size };
		const page = await browser.newPage({
			deviceScaleFactor: 1,
			viewport: initialViewport,
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

		const canvas = page.locator('#glcanvas');
		if (runForMs > 0) {
			try {
				await page.waitForFunction(
					([dialogId, buttonTitle]) => {
						const state = (globalThis as unknown as PreviewWindow).state;
						return state?.dialog.id === dialogId && state.dialog.buttons.some(button => button.title === buttonTitle);
					},
					[AUDIO_PERMISSION_DIALOG_ID, AUDIO_PERMISSION_BUTTON_TITLE],
					{ timeout: timeoutMs }
				);
			} catch {
				const suffix = pageErrors.length > 0 ? ` Browser error: ${pageErrors.at(-1)}` : '';
				throw new Error(`Project did not request audio runtime permission before the timeout.${suffix}`);
			}

			const allowButtonPosition = await page.evaluate(
				([dialogId, buttonTitle]) => {
					const state = (globalThis as unknown as PreviewWindow).state;
					const button = state?.dialog.buttons.find(candidate => candidate.title === buttonTitle);
					if (!state || state.dialog.id !== dialogId || !button) {
						throw new Error('Audio permission dialog disappeared before it could be accepted');
					}
					return {
						x: state.dialog.x + button.x + button.width / 2,
						y: state.dialog.y + button.y + button.height / 2,
					};
				},
				[AUDIO_PERMISSION_DIALOG_ID, AUDIO_PERMISSION_BUTTON_TITLE]
			);

			await canvas.click({ position: allowButtonPosition });
			await page.waitForTimeout(runForMs);

			const permissionRequestedAgain = await page.evaluate(dialogId => {
				const state = (globalThis as unknown as PreviewWindow).state;
				return state?.dialogStack.some(dialog => dialog.id === dialogId) ?? false;
			}, AUDIO_PERMISSION_DIALOG_ID);
			if (permissionRequestedAgain) {
				const suffix = pageErrors.length > 0 ? ` Browser error: ${pageErrors.at(-1)}` : '';
				throw new Error(`Audio runtime failed to start.${suffix}`);
			}

			await page.setViewportSize({ width: size, height: size });
			await page.waitForFunction(
				([width, height]) => {
					const state = (globalThis as unknown as PreviewWindow).state;
					return state?.viewport.width === width && state.viewport.height === height;
				},
				[size, size],
				{ timeout: timeoutMs }
			);
		}

		await page.evaluate(async previewPosition => {
			const previewWindow = globalThis as unknown as PreviewWindow;
			const state = previewWindow.state;
			const targetBlock =
				state?.codeBlockRendering.rootCodeBlocks.find(block => block.isHome) ??
				state?.codeBlockRendering.rootCodeBlocks[0];
			if (!state || !targetBlock) {
				throw new Error('Preview code block disappeared before capture');
			}

			state.viewportAnimation.active = false;
			state.viewport.x = targetBlock.x - previewPosition.x;
			state.viewport.y = targetBlock.y - previewPosition.y;
			state.featureFlags.modeOverlay = false;
			state.featureFlags.offscreenBlockArrows = false;
			state.codeBlockRendering.selectedCodeBlock = undefined;
			state.dialogStack.length = 0;

			await new Promise<void>(resolve => previewWindow.requestAnimationFrame(() => resolve()));
			await new Promise<void>(resolve => previewWindow.requestAnimationFrame(() => resolve()));
		}, position);

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
