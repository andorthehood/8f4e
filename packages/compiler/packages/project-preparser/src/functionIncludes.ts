import type { ProjectBlock, ProjectIncludeResolver, SourceMetadata } from '@8f4e/language-spec';
import { INCLUDES_BLOCK_DELIMITER } from './delimiters';
import { isProjectGapLine } from './projectLines';

type SyncProjectIncludeResolver = (includeId: string) => string | undefined;

type ResolvedFunctionSource = {
	code: string[];
	source: SourceMetadata;
};

export class ProjectIncludeError extends Error {
	constructor(
		message: string,
		readonly lineNumber: number,
		readonly projectBlockId?: number
	) {
		super(`Parse error at line ${lineNumber}: ${message}`);
		this.name = 'ProjectIncludeError';
	}
}

type FunctionIncludeBlock = {
	code: string[];
	startLineNumber: number;
};

type IncludeDeclaration = {
	includeId: string;
	exportedName?: string;
	localName?: string;
	lineNumber: number;
};

type ProjectIncludeDeclaration = IncludeDeclaration & { projectBlockId: number };

type IncludeBindings = Map<string, Set<string>>;

type IncludeExport = {
	lineIndex: number;
	publicName: string;
};

type IncludeFunction = {
	code: string[];
	startLineNumber: number;
	originalName: string;
	finalName: string;
	export?: IncludeExport;
};

function getFunctionName(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
}

function getIncludeFunctionPrefix(includeId: string): string {
	return `__8f4e_${includeId.replace(/[^a-zA-Z0-9]+/g, '_')}__`;
}

function startsWithInstruction(line: string, instruction: string): boolean {
	const trimmed = line.trim();
	const nextCharacter = trimmed[instruction.length];
	return (
		trimmed === instruction || (trimmed.startsWith(instruction) && (nextCharacter === ' ' || nextCharacter === '\t'))
	);
}

function normalizeSourceLines(source: string): string[] {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	return lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
}

function splitFunctionBlocks(lines: string[]): FunctionIncludeBlock[] {
	const blocks: FunctionIncludeBlock[] = [];
	let currentBlock: FunctionIncludeBlock | undefined;

	for (const [index, line] of lines.entries()) {
		if (startsWithInstruction(line, 'function')) {
			currentBlock = { code: [line], startLineNumber: index + 1 };
			continue;
		}

		currentBlock?.code.push(line);

		if (startsWithInstruction(line, 'functionEnd')) {
			blocks.push(currentBlock ?? { code: [line], startLineNumber: index + 1 });
			currentBlock = undefined;
		}
	}

	return blocks;
}

function getIncludeExport(includeId: string, block: FunctionIncludeBlock): IncludeExport | undefined {
	let includeExport: IncludeExport | undefined;

	for (const [lineIndex, line] of block.code.entries()) {
		if (!startsWithInstruction(line, '#export')) {
			continue;
		}

		if (includeExport) {
			throw new ProjectIncludeError(
				`include "${includeId}" function can only declare one #export`,
				block.startLineNumber + lineIndex
			);
		}

		const [, publicName, ...extraArgs] = line.trim().split(/\s+/);
		if (extraArgs.length > 0) {
			throw new ProjectIncludeError(
				`include "${includeId}" #export accepts at most one alias`,
				block.startLineNumber + lineIndex
			);
		}

		includeExport = {
			lineIndex,
			publicName: publicName ?? getFunctionName(block.code[0] ?? ''),
		};
	}

	return includeExport;
}

function replaceInstructionFirstArgument(line: string, instruction: string, argument: string): string {
	return line.replace(new RegExp(`^(\\s*${instruction}\\s+)\\S+`), `$1${argument}`);
}

function getLineFirstArgument(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
}

function createIncludeFunctions(includeId: string, blocks: FunctionIncludeBlock[]): IncludeFunction[] {
	const prefix = getIncludeFunctionPrefix(includeId);
	const functions = blocks.map(block => {
		const originalName = getFunctionName(block.code[0] ?? '');
		const includeExport = getIncludeExport(includeId, block);

		return {
			...block,
			originalName,
			finalName: includeExport?.publicName ?? `${prefix}${originalName}`,
			...(includeExport ? { export: includeExport } : {}),
		};
	});

	if (functions.every(func => !func.export)) {
		throw new ProjectIncludeError(`include "${includeId}" must export at least one function`, 1);
	}

	return functions;
}

function createCallTargetRewriteMap(includeId: string, functions: IncludeFunction[]): Map<string, string> {
	const finalNamesByOriginalName = new Map<string, Set<string>>();

	for (const func of functions) {
		const names = finalNamesByOriginalName.get(func.originalName) ?? new Set<string>();
		names.add(func.finalName);
		finalNamesByOriginalName.set(func.originalName, names);
	}

	// Source declarations take precedence when an export alias matches another function's source name.
	const originalNames = new Set(finalNamesByOriginalName.keys());
	for (const func of functions) {
		if (func.export && !originalNames.has(func.export.publicName)) {
			const names = finalNamesByOriginalName.get(func.export.publicName) ?? new Set<string>();
			names.add(func.finalName);
			finalNamesByOriginalName.set(func.export.publicName, names);
		}
	}

	const rewriteMap = new Map<string, string>();
	const ambiguousNames = new Set<string>();

	for (const [originalName, finalNames] of finalNamesByOriginalName) {
		if (finalNames.size === 1) {
			rewriteMap.set(originalName, [...finalNames][0]!);
		} else {
			ambiguousNames.add(originalName);
		}
	}

	for (const func of functions) {
		for (const [lineIndex, line] of func.code.entries()) {
			if (!startsWithInstruction(line, 'call')) {
				continue;
			}
			const targetName = getLineFirstArgument(line);
			if (ambiguousNames.has(targetName)) {
				throw new ProjectIncludeError(
					`include "${includeId}" call target "${targetName}" is ambiguous because that function name expands to multiple public/internal include names`,
					func.startLineNumber + lineIndex
				);
			}
		}
	}

	return rewriteMap;
}

function rewriteIncludeFunctionCode(
	func: IncludeFunction,
	callTargetRewriteMap: ReadonlyMap<string, string>
): string[] {
	return func.code.map((line, lineIndex) => {
		if (lineIndex === 0) {
			return replaceInstructionFirstArgument(line, 'function', func.finalName);
		}
		if (func.export?.lineIndex === lineIndex) {
			return '';
		}
		if (startsWithInstruction(line, 'call')) {
			const targetName = getLineFirstArgument(line);
			const rewrittenTargetName = callTargetRewriteMap.get(targetName);
			if (rewrittenTargetName && rewrittenTargetName !== targetName) {
				return replaceInstructionFirstArgument(line, 'call', rewrittenTargetName);
			}
		}
		return line;
	});
}

function addIncludeBinding(bindings: IncludeBindings, exportedName: string, localName: string): void {
	const names = bindings.get(exportedName) ?? new Set<string>();
	names.add(localName);
	bindings.set(exportedName, names);
}

function expandIncludeFunctions(
	includeId: string,
	functions: IncludeFunction[],
	bindings: IncludeBindings
): ResolvedFunctionSource[] {
	const prefix = getIncludeFunctionPrefix(includeId);
	const assignedNames = new Set([
		...functions.filter(func => !func.export).map(func => `${prefix}${func.originalName}`),
		...[...bindings.values()].flatMap(names => [...names]),
	]);
	const privateExportNames = new Map<string, string>();
	for (const func of functions) {
		const publicName = func.export?.publicName;
		if (publicName === undefined || bindings.has(publicName) || privateExportNames.has(publicName)) {
			continue;
		}
		const baseName = `${prefix}${publicName}`;
		let privateName = baseName;
		for (let suffix = 1; assignedNames.has(privateName); suffix += 1) {
			privateName = `${baseName}_${suffix}`;
		}
		assignedNames.add(privateName);
		privateExportNames.set(publicName, privateName);
	}
	// One canonical name per function keeps internal calls and helpers shared across aliases.
	const canonicalFunctions = functions.map(func => ({
		...func,
		finalName: func.export
			? (bindings.get(func.export.publicName)?.values().next().value ?? privateExportNames.get(func.export.publicName)!)
			: `${prefix}${func.originalName}`,
	}));
	const callTargetRewriteMap = createCallTargetRewriteMap(includeId, canonicalFunctions);

	return canonicalFunctions.flatMap(func => {
		const names = func.export ? bindings.get(func.export.publicName) : undefined;
		return [...(names ?? [func.finalName])].map(finalName => ({
			code: rewriteIncludeFunctionCode({ ...func, finalName }, callTargetRewriteMap),
			source: { kind: 'include' as const, includeId, symbolName: finalName },
		}));
	});
}

/**
 * Converts all public exports and their private dependencies into function source blocks.
 */
export function resolveFunctionIncludeSource(includeId: string, source: string): ResolvedFunctionSource[] {
	const functions = createIncludeFunctions(includeId, splitFunctionBlocks(normalizeSourceLines(source)));
	const bindings: IncludeBindings = new Map();
	for (const func of functions) {
		if (func.export) {
			addIncludeBinding(bindings, func.export.publicName, func.export.publicName);
		}
	}
	return expandIncludeFunctions(includeId, functions, bindings);
}

export function collectProjectIncludeIdsFromBlock(block: Pick<ProjectBlock, 'code' | 'id'>) {
	const includeIds: IncludeDeclaration[] = [];

	for (const [index, line] of block.code.entries()) {
		const lineNumber = index + 1;
		const trimmed = line.trim();
		if (
			trimmed === INCLUDES_BLOCK_DELIMITER.opener ||
			trimmed === INCLUDES_BLOCK_DELIMITER.closer ||
			isProjectGapLine(trimmed)
		) {
			continue;
		}

		const [instruction, includeId, exportedName, localName, ...extraArgs] = trimmed.split(/\s+/);
		if (instruction !== 'include' || !includeId || extraArgs.length > 0) {
			throw new ProjectIncludeError('include expects <path> [exportedName [localName]]', lineNumber, block.id);
		}
		includeIds.push({
			includeId,
			lineNumber,
			...(exportedName ? { exportedName } : {}),
			...(localName ? { localName } : {}),
		});
	}

	return includeIds;
}

export function collectProjectIncludeIdsFromText(text: string): string[] {
	const includeIds: string[] = [];
	const lines = text.split('\n');

	for (let i = 1; i < lines.length; i += 1) {
		const trimmed = lines[i].trim();
		if (trimmed !== INCLUDES_BLOCK_DELIMITER.opener) {
			continue;
		}

		const blockLines = [lines[i]];
		const blockStartLineNumber = i + 1;
		for (i += 1; i < lines.length; i += 1) {
			blockLines.push(lines[i]);
			if (lines[i].trim() === INCLUDES_BLOCK_DELIMITER.closer) {
				break;
			}
		}

		includeIds.push(
			...collectProjectIncludeIdsFromBlock({ id: blockStartLineNumber, code: blockLines }).map(
				({ includeId }) => includeId
			)
		);
	}

	return includeIds;
}

export function resolveProjectIncludes(
	includeBlocks: readonly Pick<ProjectBlock, 'code' | 'id' | 'disabled'>[],
	resolveInclude: SyncProjectIncludeResolver
): ResolvedFunctionSource[] {
	const includedFunctionBlocks: ResolvedFunctionSource[] = [];
	const declarationsByIncludeId = new Map<string, ProjectIncludeDeclaration[]>();

	for (const block of includeBlocks) {
		if (block.disabled) {
			continue;
		}
		for (const declaration of collectProjectIncludeIdsFromBlock(block)) {
			const declarations = declarationsByIncludeId.get(declaration.includeId) ?? [];
			declarations.push({ ...declaration, projectBlockId: block.id });
			declarationsByIncludeId.set(declaration.includeId, declarations);
		}
	}

	for (const [includeId, declarations] of declarationsByIncludeId) {
		const source = resolveInclude(includeId);
		if (source === undefined) {
			const { lineNumber, projectBlockId } = declarations[0]!;
			throw new ProjectIncludeError(`unresolved include "${includeId}"`, lineNumber, projectBlockId);
		}
		const functions = createIncludeFunctions(includeId, splitFunctionBlocks(normalizeSourceLines(source)));
		const publicNames = new Set(functions.flatMap(func => (func.export ? [func.export.publicName] : [])));
		const bindings: IncludeBindings = new Map();
		for (const { exportedName, localName, lineNumber, projectBlockId } of declarations) {
			if (exportedName === undefined) {
				for (const publicName of publicNames) {
					addIncludeBinding(bindings, publicName, publicName);
				}
			} else {
				if (!publicNames.has(exportedName)) {
					throw new ProjectIncludeError(
						`include "${includeId}" does not export "${exportedName}"`,
						lineNumber,
						projectBlockId
					);
				}
				addIncludeBinding(bindings, exportedName, localName ?? exportedName);
			}
		}
		includedFunctionBlocks.push(...expandIncludeFunctions(includeId, functions, bindings));
	}

	return includedFunctionBlocks;
}

export async function resolveProjectIncludesAsync(
	includeBlocks: readonly Pick<ProjectBlock, 'code' | 'id' | 'disabled'>[],
	resolveInclude: ProjectIncludeResolver
): Promise<ResolvedFunctionSource[]> {
	const includeSources = new Map<string, string | undefined>();

	for (const block of includeBlocks) {
		if (block.disabled) {
			continue;
		}
		for (const { includeId } of collectProjectIncludeIdsFromBlock(block)) {
			if (!includeSources.has(includeId)) {
				includeSources.set(includeId, await resolveInclude(includeId));
			}
		}
	}

	return resolveProjectIncludes(includeBlocks, includeId => includeSources.get(includeId));
}
