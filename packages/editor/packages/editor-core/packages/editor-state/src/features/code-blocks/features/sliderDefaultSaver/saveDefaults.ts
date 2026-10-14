import type { CodeBlockGraphicData, PianoKeyboard, Slider, State } from '@8f4e/editor-state-types';
import {
	ArgumentType,
	arrayMemoryDeclarationInstructions,
	type CompilerASTLine,
	isMemoryDeclarationLine,
	scalarMemoryDeclarationInstructions,
} from '@8f4e/language-spec';
import { parseLine } from '@8f4e/tokenizer';
import getCodeBlockModuleId from '~/pureHelpers/getCodeBlockModuleId';

const scalarMemoryDeclarationInstructionSet = new Set<string>(scalarMemoryDeclarationInstructions);
const arrayMemoryDeclarationInstructionSet = new Set<string>(arrayMemoryDeclarationInstructions);
const float32DecodeBuffer = new ArrayBuffer(4);
const float32DecodeInt32 = new Int32Array(float32DecodeBuffer);
const float32DecodeFloat32 = new Float32Array(float32DecodeBuffer);
const float64DecodeBuffer = new ArrayBuffer(8);
const float64DecodeView = new DataView(float64DecodeBuffer);

function escapeRegExp(text: string): string {
	return text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSourceLine(line: string, lineNumber: number): CompilerASTLine | undefined {
	try {
		return parseLine(line, lineNumber);
	} catch {
		return undefined;
	}
}

function getMemoryDeclarationId(line: string, lineNumber: number, isArray = false): string | undefined {
	const parsedLine = parseSourceLine(line, lineNumber);
	if (
		!parsedLine ||
		!isMemoryDeclarationLine(parsedLine) ||
		!(isArray ? arrayMemoryDeclarationInstructionSet : scalarMemoryDeclarationInstructionSet).has(
			parsedLine.instruction
		)
	) {
		return undefined;
	}

	const [firstArg] = parsedLine.arguments;
	if (firstArg?.type !== ArgumentType.IDENTIFIER || firstArg.referenceKind !== 'plain') {
		return undefined;
	}

	return firstArg.value;
}

function decodeFloat32Word(word: number): number {
	float32DecodeInt32[0] = word;
	return float32DecodeFloat32[0];
}

function decodeFloat64Words(lowWord: number, highWord: number): number {
	float64DecodeView.setInt32(0, lowWord, true);
	float64DecodeView.setInt32(4, highWord, true);
	return float64DecodeView.getFloat64(0, true);
}

function getDecimalPlaces(value: number): number {
	const text = value.toString();
	const exponentMatch = text.match(/e-(\d+)$/i);
	if (exponentMatch) {
		return Number.parseInt(exponentMatch[1], 10);
	}

	return text.includes('.') ? text.split('.')[1].length : 0;
}

function readRuntimeSliderValue(slider: Slider, getWordFromMemory: (wordAlignedAddress: number) => number): number {
	if (slider.isInteger) {
		return getWordFromMemory(slider.wordAlignedAddress);
	}

	if (slider.isFloat64) {
		return decodeFloat64Words(
			getWordFromMemory(slider.wordAlignedAddress),
			getWordFromMemory(slider.wordAlignedAddress + 1)
		);
	}

	return decodeFloat32Word(getWordFromMemory(slider.wordAlignedAddress));
}

function formatRuntimeSliderValue(value: number, slider: Slider): string | undefined {
	if (!Number.isFinite(value)) {
		return undefined;
	}

	if (slider.isInteger) {
		return `${Math.round(value)}`;
	}

	const decimalPlaces =
		slider.step !== undefined && slider.step > 0
			? Math.min(12, getDecimalPlaces(slider.step))
			: slider.isFloat64
				? 12
				: 6;
	const roundedValue = Number.parseFloat(value.toFixed(decimalPlaces));
	const serializedValue = Object.is(roundedValue, -0) ? '0' : roundedValue.toString();

	return /[.eE]/.test(serializedValue) ? serializedValue : `${serializedValue}.0`;
}

function replaceMemoryDeclarationDefault(
	line: string,
	memoryId: string,
	value: string,
	isArray = false
): string | undefined {
	const [body = '', comment] = line.split(/;(.*)/s);
	const pattern = new RegExp(
		`^(?<prefix>\\s*\\S+\\s+${escapeRegExp(memoryId)}${isArray ? '\\s+\\S+' : ''})(?<defaults>(?:\\s+\\S+)*)?(?<trailingWhitespace>\\s*)$`
	);
	const groups = pattern.exec(body)?.groups;
	if (!groups?.prefix) {
		return undefined;
	}

	return `${groups.prefix}${value ? ` ${value}` : ''}${comment !== undefined ? ` ;${comment}` : ''}`;
}

interface DefaultValue {
	moduleId: string;
	memoryId: string;
	value: string;
	isArray: boolean;
}

function getSliderDefaults(sliders: Slider[], read: (address: number) => number): DefaultValue[][] {
	return sliders.flatMap(slider => {
		const value = formatRuntimeSliderValue(readRuntimeSliderValue(slider, read), slider);
		return value === undefined ? [] : [[{ moduleId: slider.moduleId, memoryId: slider.id, value, isArray: false }]];
	});
}

function getPianoDefaults(keyboards: PianoKeyboard[], read: (address: number) => number): DefaultValue[][] {
	return keyboards.flatMap(keyboard => {
		const notes = keyboard.pressedKeysListMemory;
		const countMemory = keyboard.pressedNumberOfKeysMemory;
		const runtimeCount = read(countMemory.wordAlignedAddress);
		if (!Number.isFinite(runtimeCount)) return [];
		const count = Math.min(Math.max(0, Math.trunc(runtimeCount)), notes.numberOfElements);
		const values: string[] = [];
		for (let index = 0; index < count; index++) {
			const address = notes.wordAlignedAddress + (index * notes.elementWordSize) / Int32Array.BYTES_PER_ELEMENT;
			const word = read(address);
			const value = notes.isInteger
				? word
				: notes.isFloat64
					? decodeFloat64Words(word, read(address + 1))
					: decodeFloat32Word(word);
			if (!Number.isFinite(value)) return [];
			const serialized = Object.is(value, -0) ? '0' : value.toString();
			values.push(notes.isInteger || /[.eE]/.test(serialized) ? serialized : `${serialized}.0`);
		}
		return [
			[
				{ moduleId: keyboard.pressedKeysListModuleId, memoryId: notes.id, value: values.join(' '), isArray: true },
				{
					moduleId: keyboard.pressedNumberOfKeysModuleId,
					memoryId: countMemory.id,
					value: count.toString(),
					isArray: false,
				},
			],
		];
	});
}

export interface ControlDefaultEdit {
	codeBlock: CodeBlockGraphicData;
	code: string[];
}

/** Routes already-resolved control values to their canonical source owners. */
export function getControlDefaultEdits(state: State, source: CodeBlockGraphicData): ControlDefaultEdit[] {
	const read = state.callbacks.getWordFromMemory;
	if (!read) return [];

	const owners = new Map<string, CodeBlockGraphicData>();
	const collectOwners = (blocks: CodeBlockGraphicData[]) => {
		for (const block of blocks) {
			if (block.nestedProjectCodeBlocks !== undefined) collectOwners(block.nestedProjectCodeBlocks);
			else if (block.blockType === 'module') owners.set(getCodeBlockModuleId(block), block);
		}
	};
	collectOwners(state.codeBlockRendering.rootCodeBlocks);

	const updates = new Map<CodeBlockGraphicData, string[]>();
	const groups = [
		...getSliderDefaults(source.widgets.sliders, read),
		...getPianoDefaults(source.widgets.pianoKeyboards, read),
	];
	for (const group of groups) {
		const edits = group.map(edit => {
			const owner = owners.get(edit.moduleId);
			if (!owner) return;
			const code = updates.get(owner) ?? owner.code;
			const row = code.findIndex(
				(line, index) => getMemoryDeclarationId(line, index + 1, edit.isArray) === edit.memoryId
			);
			if (row === -1) return;
			const line = replaceMemoryDeclarationDefault(code[row], edit.memoryId, edit.value, edit.isArray);
			return line === undefined ? undefined : { owner, row, line };
		});
		// A piano's notes and count are saved together, including when they have different owners.
		if (!edits.every(edit => edit !== undefined)) continue;
		for (const edit of edits) {
			const code = updates.get(edit.owner) ?? [...edit.owner.code];
			code[edit.row] = edit.line;
			updates.set(edit.owner, code);
		}
	}

	return [...updates].flatMap(([codeBlock, code]) =>
		code.some((line, row) => line !== codeBlock.code[row]) ? [{ codeBlock, code }] : []
	);
}
