import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Command } from 'commander';

import { convertPmmlNeuralNetworkToProject } from './index';

async function runCli(): Promise<void> {
	const program = new Command();

	program
		.name('pmml28f4e')
		.description('Convert PMML neural networks into 8f4e project files')
		.argument('<input>', 'Input PMML file path')
		.option('-o, --out <path>', 'Output file path (prints to stdout if not specified)')
		.option('-p, --pretty', 'Format output with indentation')
		.action(async (inputPath: string, options: { out?: string; name?: string; pretty?: boolean }) => {
			const inputFile = resolve(process.cwd(), inputPath);
			const pmmlXml = await readFile(inputFile, 'utf8');
			const project = convertPmmlNeuralNetworkToProject(pmmlXml);
			const json = JSON.stringify(project, null, options.pretty ? 2 : 0);

			if (options.out) {
				const resolvedOut = resolve(process.cwd(), options.out);
				await writeFile(resolvedOut, json, 'utf8');
			} else {
				console.log(json);
			}
		});

	await program.parseAsync(process.argv);
}

runCli().catch(error => {
	console.error('pmml28f4e failed:', error instanceof Error ? error.message : error);
	process.exit(1);
});
