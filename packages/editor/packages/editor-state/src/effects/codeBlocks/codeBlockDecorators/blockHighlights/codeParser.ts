import instructionParser from '../instructionParser';

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
	return blocks.reduce((count, block) => (!block.endLineNumber ? count + 1 : count), 0);
}

function getLastOpenBlockByEndInstruction(blocks: CodeBlock[], instruction: string) {
	return blocks
		.slice()
		.reverse()
		.find(block => block.endInstruction === instruction && !block.endLineNumber);
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

		if (endInstructions.includes(instruction)) {
			const lastOpenBlock = getLastOpenBlockByEndInstruction(blocks, instruction);

			if (lastOpenBlock) {
				lastOpenBlock.endLineNumber = lineIndex;
			}
		}
	});

	return blocks;
}
