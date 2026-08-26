import {
	isMemoryDeclarationInstructionName,
	isValidModuleName,
	type MemoryDeclarationInstruction,
	type ProjectMemoryExposure,
	projectInstructions,
} from '@8f4e/language-spec';
import { startsWithInstruction } from './projectKeywords';

const EXPOSURE_INSTRUCTION = projectInstructions.expose;

function isValidNamedMemoryReference(value: string): boolean {
	return value.length > 0 && !/[&:.\s]/.test(value) && !/^\d+$/.test(value);
}

/** Parses one group-level `expose` declaration. */
export function parseProjectMemoryExposureLine(line: string, lineNumber: number): ProjectMemoryExposure {
	const [instruction, type, name, target, ...extra] = line.trim().split(/\s+/);
	if (
		instruction !== EXPOSURE_INSTRUCTION ||
		!isMemoryDeclarationInstructionName(type ?? '') ||
		!isValidNamedMemoryReference(name ?? '') ||
		!target?.startsWith('&') ||
		extra.length > 0
	) {
		throw new Error(`Parse error at line ${lineNumber}: expected "expose <type> <name> &<module>:<memory>"`);
	}

	const targetParts = target.slice(1).split(':');
	const [targetModuleName, targetMemoryName] = targetParts;
	if (
		targetParts.length !== 2 ||
		!isValidModuleName(targetModuleName ?? '') ||
		!isValidNamedMemoryReference(targetMemoryName ?? '')
	) {
		throw new Error(`Parse error at line ${lineNumber}: expected "expose <type> <name> &<module>:<memory>"`);
	}

	return {
		type: type as MemoryDeclarationInstruction,
		name,
		targetModuleName,
		targetMemoryName,
	};
}

/** Parses an exposure line when valid, returning undefined for other or incomplete live-editor lines. */
export function tryParseProjectMemoryExposureLine(line: string): ProjectMemoryExposure | undefined {
	if (!startsWithInstruction(line.trim(), EXPOSURE_INSTRUCTION)) {
		return undefined;
	}

	try {
		return parseProjectMemoryExposureLine(line, 1);
	} catch {
		return undefined;
	}
}

/** Serializes one canonical project memory exposure. */
export function serializeProjectMemoryExposure(exposure: ProjectMemoryExposure): string {
	return `expose ${exposure.type} ${exposure.name} &${exposure.targetModuleName}:${exposure.targetMemoryName}`;
}
