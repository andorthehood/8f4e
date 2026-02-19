import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Command } from 'commander';
import { serializeProjectTo8f4e } from '@8f4e/editor-state';

import { convertPmmlNeuralNetworkToProject } from './index';

async function runCli(): Promise<void> {
	const program = new Command();

	program
		.name('pmml28f4e')
		.description('Convert PMML neural networks into 8f4e project files')
		.argument('<input>', 'Input PMML file path')
		.option('-o, --out <path>', 'Output file path (prints to stdout if not specified)')
		.action(async (inputPath: string, options: { out?: string }) => {
			const inputFile = resolve(process.cwd(), inputPath);
			const pmmlXml = await readFile(inputFile, 'utf8');
			const project = convertPmmlNeuralNetworkToProject(pmmlXml);
			const text = serializeProjectTo8f4e(project);

			if (options.out) {
				const resolvedOut = resolve(process.cwd(), options.out);
				await writeFile(resolvedOut, text, 'utf8');
			} else {
				console.log(text);
			}
		});

	await program.parseAsync(process.argv);
}

runCli().catch(error => {
	console.error('pmml28f4e failed:', error instanceof Error ? error.message : error);
	process.exit(1);
});
