import { instructionParser } from '@8f4e/compiler/syntax';

const startInstructions = ['if', 'loop', 'block'];

const endInstructions = ['ifEnd', 'loopEnd', 'blockEnd'];

interface CodeBlock {
	startInstruction: string;
	endInstruction: string;
	startLineNumber: number;
	endLineNumber?: number;
	depth: number;
}

function countOpenBlocks(blocks: CodeBlock[]) {
	return blocks.reduce((count, block) => (block.endLineNumber === undefined ? count + 1 : count), 0);
}

function getLastOpenBlockByEndInstruction(blocks: CodeBlock[], instruction: string) {
	return blocks
		.slice()
		.reverse()
		.find(block => block.endInstruction === instruction && block.endLineNumber === undefined);
}

export default function parseCodeBlocks(code: string[]) {
	const blocks: CodeBlock[] = [];

	code.forEach((line, lineIndex) => {
		const [, instruction] = (line.match(instructionParser) || []) as [never, string];

		const openBlockCount = countOpenBlocks(blocks);

		if (startInstructions.includes(instruction)) {
			blocks.push({
				startInstruction: instruction,
				endInstruction: endInstructions[startInstructions.indexOf(instruction)],
				startLineNumber: lineIndex,
				endLineNumber: undefined,
				depth: openBlockCount,
			});
		}

		if (instruction === 'else') {
			const lastOpenIfBlock = blocks
				.slice()
				.reverse()
				.find(
					block =>
						block.startInstruction === 'if' && block.endInstruction === 'ifEnd' && block.endLineNumber === undefined
				);

			if (lastOpenIfBlock) {
				lastOpenIfBlock.endLineNumber = lineIndex;
				blocks.push({
					startInstruction: 'else',
					endInstruction: 'ifEnd',
					startLineNumber: lineIndex,
					endLineNumber: undefined,
					depth: lastOpenIfBlock.depth,
				});
			}
		}

		if (endInstructions.includes(instruction)) {
			const lastOpenBlock = getLastOpenBlockByEndInstruction(blocks, instruction);

			if (lastOpenBlock) {
				lastOpenBlock.endLineNumber = lineIndex;
			}
		}
	});

	return blocks;
}
