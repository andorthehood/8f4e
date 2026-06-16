import type { CodeBlockGraphicData, Slider } from '@8f4e/editor-state-types';
import {
	ArgumentType,
	type CompilerASTLine,
	isMemoryDeclarationLine,
	scalarMemoryDeclarationInstructions,
} from '@8f4e/language-spec';
import { parseLine } from '@8f4e/tokenizer';

const scalarMemoryDeclarationInstructionSet = new Set<string>(scalarMemoryDeclarationInstructions);
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

function getScalarMemoryDeclarationId(line: string, lineNumber: number): string | undefined {
	const parsedLine = parseSourceLine(line, lineNumber);
	if (
		!parsedLine ||
		!isMemoryDeclarationLine(parsedLine) ||
		!scalarMemoryDeclarationInstructionSet.has(parsedLine.instruction)
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

function replaceScalarMemoryDeclarationDefault(line: string, memoryId: string, value: string): string | undefined {
	const [body = '', comment] = line.split(/;(.*)/s);
	const pattern = new RegExp(
		`^(?<prefix>\\s*\\S+\\s+${escapeRegExp(memoryId)})(?<defaults>(?:\\s+\\S+)*)?(?<trailingWhitespace>\\s*)$`
	);
	const groups = pattern.exec(body)?.groups;
	if (!groups?.prefix) {
		return undefined;
	}

	return `${groups.prefix} ${value}${comment !== undefined ? ` ;${comment}` : ''}`;
}

export function saveSliderDefaultValuesToCode(
	codeBlock: CodeBlockGraphicData,
	getWordFromMemory: ((wordAlignedAddress: number) => number) | undefined
): string[] | undefined {
	if (!getWordFromMemory || codeBlock.widgets.sliders.length === 0) {
		return undefined;
	}

	const sliderValueById = new Map<string, string>();
	for (const slider of codeBlock.widgets.sliders) {
		const value = formatRuntimeSliderValue(readRuntimeSliderValue(slider, getWordFromMemory), slider);
		if (value !== undefined) {
			sliderValueById.set(slider.id, value);
		}
	}

	if (sliderValueById.size === 0) {
		return undefined;
	}

	let didUpdate = false;
	const updatedCode = codeBlock.code.map((line, index) => {
		const memoryId = getScalarMemoryDeclarationId(line, index + 1);
		const value = memoryId ? sliderValueById.get(memoryId) : undefined;
		if (!memoryId || value === undefined) {
			return line;
		}

		const updatedLine = replaceScalarMemoryDeclarationDefault(line, memoryId, value);
		if (updatedLine === undefined || updatedLine === line) {
			return line;
		}

		didUpdate = true;
		return updatedLine;
	});

	return didUpdate ? updatedCode : undefined;
}
