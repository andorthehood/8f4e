#!/usr/bin/env node
import path from 'node:path';

import {
	DEFAULT_PREVIEW_POSITION,
	DEFAULT_PREVIEW_RUN_FOR_MS,
	DEFAULT_PREVIEW_SIZE,
	generateProjectPreview,
	type ProjectPreviewFormat,
} from './index';

const USAGE = `Usage: 8f4e-preview icon <project.8f4e> [--out <preview.gif>] [--size <pixels>] [--offset-x <pixels>] [--offset-y <pixels>] [--run-for <milliseconds>]

Formats:
  icon    Capture a square GIF from the @home block, or the first root block

Options:
  --size       Output width and height in pixels (default: 64)
  --offset-x   Horizontal distance from the image's left edge (default: 0)
  --offset-y   Vertical distance from the image's top edge (default: 0)
  --run-for    Start audio and wait before capture (disabled by default)

GIF output uses an optimized palette with dithering disabled.`;

interface ParsedArguments {
	format: ProjectPreviewFormat;
	inputPath: string;
	outputPath: string;
	position: {
		x: number;
		y: number;
	};
	runForMs: number;
	size: number;
}

function getDefaultOutputPath(inputPath: string): string {
	const extension = path.extname(inputPath);
	return path.join(path.dirname(inputPath), `${path.basename(inputPath, extension)}.icon.gif`);
}

function parseIntegerOption(option: string, value: string | undefined, allowNegative: boolean): number {
	const pattern = allowNegative ? /^-?\d+$/ : /^[1-9]\d*$/;
	if (!value || !pattern.test(value)) {
		throw new Error(`Invalid value for ${option}: ${value ?? '(missing)'}\n${USAGE}`);
	}

	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) {
		throw new Error(`Invalid value for ${option}: ${value}\n${USAGE}`);
	}
	return parsed;
}

export function parseArguments(args: string[]): ParsedArguments | undefined {
	if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
		return undefined;
	}

	const [format, inputPath, ...options] = args;
	if (format !== 'icon') {
		throw new Error(`Unknown preview format: ${format}\n${USAGE}`);
	}
	if (!inputPath || inputPath.startsWith('-')) {
		throw new Error(`Missing project input path\n${USAGE}`);
	}

	let outputPath = getDefaultOutputPath(inputPath);
	let runForMs = DEFAULT_PREVIEW_RUN_FOR_MS;
	let size = DEFAULT_PREVIEW_SIZE;
	const position: { x: number; y: number } = { ...DEFAULT_PREVIEW_POSITION };
	for (let index = 0; index < options.length; index++) {
		const option = options[index];
		if (option === '--out') {
			const value = options[++index];
			if (!value || value.startsWith('-')) {
				throw new Error(`Missing value for --out\n${USAGE}`);
			}
			outputPath = value;
			continue;
		}
		if (option === '--size') {
			size = parseIntegerOption(option, options[++index], false);
			continue;
		}
		if (option === '--offset-x') {
			position.x = parseIntegerOption(option, options[++index], true);
			continue;
		}
		if (option === '--offset-y') {
			position.y = parseIntegerOption(option, options[++index], true);
			continue;
		}
		if (option === '--run-for') {
			runForMs = parseIntegerOption(option, options[++index], false);
			continue;
		}

		throw new Error(`Unknown option: ${option}\n${USAGE}`);
	}

	return { format, inputPath, outputPath, position, runForMs, size };
}

async function run(): Promise<void> {
	const options = parseArguments(process.argv.slice(2));
	if (!options) {
		console.log(USAGE);
		return;
	}

	await generateProjectPreview(options);
	console.log(`Created ${path.resolve(options.outputPath)}`);
}

run().catch(error => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});
