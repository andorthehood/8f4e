import { compilableBlockTypes, documentBlockInstructionByType } from '@8f4e/compiler-spec';

import type { BlockType } from './types';

const CLI_BLOCK_DELIMITERS = compilableBlockTypes.map(type => documentBlockInstructionByType[type]);

function startsWithInstructionArgument(line: string, instruction: string): boolean {
	const nextCharacter = line[instruction.length];
	return line.startsWith(instruction) && (nextCharacter === ' ' || nextCharacter === '\t');
}

export default function getBlockType(code: string[]): BlockType {
	for (const line of code) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';') || trimmed.startsWith('//')) {
			continue;
		}
		const blockDelimiter = CLI_BLOCK_DELIMITERS.find(({ start }) => startsWithInstructionArgument(trimmed, start));
		if (blockDelimiter) return blockDelimiter.type;
		break;
	}
	return 'unknown';
}
