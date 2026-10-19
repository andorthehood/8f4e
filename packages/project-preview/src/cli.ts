#!/usr/bin/env node
import path from 'node:path';

import { generateProjectPreview, type ProjectPreviewFormat } from './index';

const USAGE = `Usage: 8f4e-preview icon <project.8f4e> [--out <preview.gif>]

Formats:
  icon    Capture a 64x64 GIF from the first @home code block's top-left corner

GIF output uses an optimized palette with dithering disabled.`;

interface ParsedArguments {
	format: ProjectPreviewFormat;
	inputPath: string;
	outputPath: string;
}

function getDefaultOutputPath(inputPath: string): string {
	const extension = path.extname(inputPath);
	return path.join(path.dirname(inputPath), `${path.basename(inputPath, extension)}.icon.gif`);
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

		throw new Error(`Unknown option: ${option}\n${USAGE}`);
	}

	return { format, inputPath, outputPath };
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
