import { documentBlockInstructionByType } from '@8f4e/compiler-spec';
import { ENTRY_BLOCK_DELIMITER, FORMAT_HEADER, GROUP_BLOCK_DELIMITER, INCLUDES_BLOCK_DELIMITER } from './delimiters';
import { resolveFunctionIncludeSource } from './functionIncludes';
import { getExpectedProjectCloserPrefix, getProjectCloserKeyword, getProjectOpenerKeyword } from './projectKeywords';
import { getProjectBlockName, isProjectGapLine } from './projectLines';
import type { ProjectCodeBlock, ProjectCodeGroup, ProjectInput } from './types';

export { getDocumentProjectBlockType, getProjectBlockType } from './blockClassification';
export { BLOCK_DELIMITERS, FORMAT_HEADER, INCLUDES_BLOCK_DELIMITER } from './delimiters';
export { pickProjectCompilerBlocks } from './pickProjectCompilerBlocks';
export { getExpectedProjectCloserPrefix, getProjectCloserKeyword, getProjectOpenerKeyword } from './projectKeywords';
export type {
	ProjectBlockType,
	ProjectCodeBlock,
	ProjectInput,
} from './types';

type ProjectContainerDelimiter = {
	opener: string;
	closer: string;
};

type ProjectContainerContentOptions = {
	entry: string;
	container: ProjectContainerDelimiter;
	codeBlocks: ProjectCodeBlock[];
	groups: ProjectCodeGroup[];
	validateDocumentOpener: (opener: string, line: string, lineNumber: number) => void;
};

export type ProjectIncludeResolver = (includeId: string) => string | undefined;
export type ProjectIncludeResolverAsync = (includeId: string) => string | Promise<string | undefined> | undefined;

export interface Parse8f4eProjectOptions {
	resolveInclude?: ProjectIncludeResolver;
}

export interface Parse8f4eProjectAsyncOptions {
	resolveInclude?: ProjectIncludeResolverAsync;
}

function collectProjectIncludeIds(text: string): string[] {
	const includeIds: string[] = [];
	const lines = text.split('\n');

	for (let i = 1; i < lines.length; i += 1) {
		const trimmed = lines[i].trim();
		if (trimmed !== INCLUDES_BLOCK_DELIMITER.opener) {
			continue;
		}

		for (i += 1; i < lines.length; i += 1) {
			const includeLine = lines[i].trim();
			if (includeLine === INCLUDES_BLOCK_DELIMITER.closer) {
				break;
			}
			if (isProjectGapLine(includeLine)) {
				continue;
			}

			const [instruction, includeId] = includeLine.split(/\s+/);
			if (instruction === 'include' && includeId) {
				includeIds.push(includeId);
			}
		}
	}

	return includeIds;
}

/**
 * Parses 8f4e project.
 *
 * @param text - Project source text to parse.
 * @returns Parsed 8f4e project.
 */
export function parse8f4eProject(text: string, options: Parse8f4eProjectOptions = {}): ProjectInput {
	const lines = text.split('\n');

	if (lines[0]?.trim() !== FORMAT_HEADER) {
		throw new Error(`Invalid .8f4e file: expected header "${FORMAT_HEADER}", got "${lines[0]?.trim() ?? ''}"`);
	}

	const codeBlocks: ProjectCodeBlock[] = [];
	const groups: ProjectCodeGroup[] = [];
	const includedFunctionBlocks: NonNullable<ProjectInput['includedFunctionBlocks']> = [];
	const seenEntryNames = new Set<string>();

	function readProjectCodeBlock(startIndex: number, targetCodeBlocks: ProjectCodeBlock[], entry?: string): number {
		const openerLine = lines[startIndex];
		const openerKeyword = getProjectOpenerKeyword(openerLine.trim());
		if (
			!openerKeyword ||
			openerKeyword === ENTRY_BLOCK_DELIMITER.opener ||
			openerKeyword === GROUP_BLOCK_DELIMITER.opener
		) {
			throw new Error(`Parse error at line ${startIndex + 1}: expected document block opener`);
		}

		const expectedCloser = getExpectedProjectCloserPrefix(openerKeyword);
		const currentBlockLines = [openerLine];

		for (let i = startIndex + 1; i < lines.length; i += 1) {
			const line = lines[i];
			const trimmed = line.trim();
			currentBlockLines.push(line);

			const closer = getProjectCloserKeyword(trimmed);
			if (closer) {
				if (closer !== expectedCloser) {
					throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${openerKeyword}"`);
				}

				targetCodeBlocks.push({
					id: startIndex + 1,
					code: currentBlockLines,
					...(entry ? { entry } : {}),
				});
				return i + 1;
			}

			if (trimmed !== '') {
				const innerOpener = getProjectOpenerKeyword(trimmed);
				if (innerOpener) {
					throw new Error(
						`Parse error at line ${i + 1}: mixed block type markers (found opener "${trimmed}" inside "${openerKeyword}" block)`
					);
				}
			}
		}

		throw new Error(`Parse error: unclosed block with opener "${openerKeyword}"`);
	}

	function readIncludesBlock(startIndex: number): number {
		const openerLine = lines[startIndex];
		const openerKeyword = getProjectOpenerKeyword(openerLine.trim());
		if (openerKeyword !== INCLUDES_BLOCK_DELIMITER.opener) {
			throw new Error(`Parse error at line ${startIndex + 1}: expected includes opener`);
		}

		for (let i = startIndex + 1; i < lines.length; i += 1) {
			const line = lines[i];
			const trimmed = line.trim();
			if (isProjectGapLine(trimmed)) {
				continue;
			}

			const closer = getProjectCloserKeyword(trimmed);
			if (closer === INCLUDES_BLOCK_DELIMITER.closer) {
				return i + 1;
			}
			if (closer) {
				throw new Error(
					`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${INCLUDES_BLOCK_DELIMITER.opener}"`
				);
			}

			const [instruction, includeId, ...extraArgs] = trimmed.split(/\s+/);
			if (instruction !== 'include' || !includeId || extraArgs.length > 0) {
				throw new Error(`Parse error at line ${i + 1}: include requires exactly one include id`);
			}

			const source = options.resolveInclude?.(includeId);
			if (source === undefined) {
				throw new Error(`Parse error at line ${i + 1}: unresolved include "${includeId}"`);
			}

			includedFunctionBlocks.push(...resolveFunctionIncludeSource(includeId, source));
		}

		throw new Error(`Parse error: unclosed block with opener "${INCLUDES_BLOCK_DELIMITER.opener}"`);
	}

	function readProjectContainerContents(startIndex: number, options: ProjectContainerContentOptions): number {
		// Entries and groups have the same recursive container grammar: skip gaps,
		// accept nested groups, read document blocks, and stop at the matching closer.
		// The caller supplies the containment policy because entries still expose only
		// direct modules to the flat compiler path, while groups preserve all block types.
		for (let i = startIndex; i < lines.length; ) {
			const line = lines[i];
			const trimmed = line.trim();

			if (isProjectGapLine(trimmed)) {
				i += 1;
				continue;
			}

			const closer = getProjectCloserKeyword(trimmed);
			if (closer === options.container.closer) {
				return i + 1;
			}
			if (closer) {
				throw new Error(
					`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${options.container.opener}"`
				);
			}

			const opener = getProjectOpenerKeyword(trimmed);
			if (!opener) {
				throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
			}
			if (opener === GROUP_BLOCK_DELIMITER.opener) {
				const nested = readProjectGroup(i, options.entry);
				options.groups.push(nested.group);
				i = nested.nextIndex;
				continue;
			}

			options.validateDocumentOpener(opener, trimmed, i + 1);
			i = readProjectCodeBlock(i, options.codeBlocks, options.entry);
		}

		throw new Error(`Parse error: unclosed block with opener "${options.container.opener}"`);
	}

	function validateGroupDocumentOpener(opener: string, _line: string, lineNumber: number): void {
		// Groups can recursively hold any document block, but entries remain the
		// project root container and are never valid inside another project container.
		if (opener === ENTRY_BLOCK_DELIMITER.opener) {
			throw new Error(`Parse error at line ${lineNumber}: entry blocks cannot be nested inside groups`);
		}
	}

	function readProjectGroup(startIndex: number, entry: string): { nextIndex: number; group: ProjectCodeGroup } {
		const openerLine = lines[startIndex];
		const openerKeyword = getProjectOpenerKeyword(openerLine.trim());
		if (openerKeyword !== GROUP_BLOCK_DELIMITER.opener) {
			throw new Error(`Parse error at line ${startIndex + 1}: expected group opener`);
		}

		const group: ProjectCodeGroup = {
			name: getProjectBlockName(openerLine, startIndex + 1, 'group'),
			entry,
			codeBlocks: [],
			groups: [],
		};

		return {
			nextIndex: readProjectContainerContents(startIndex + 1, {
				entry,
				container: GROUP_BLOCK_DELIMITER,
				codeBlocks: group.codeBlocks,
				groups: group.groups,
				validateDocumentOpener: validateGroupDocumentOpener,
			}),
			group,
		};
	}

	for (let i = 1; i < lines.length; ) {
		const trimmed = lines[i].trim();

		if (isProjectGapLine(trimmed)) {
			i += 1;
			continue;
		}

		const opener = getProjectOpenerKeyword(trimmed);
		if (!opener) {
			throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
		}

		if (opener !== ENTRY_BLOCK_DELIMITER.opener) {
			if (opener === INCLUDES_BLOCK_DELIMITER.opener) {
				i = readIncludesBlock(i);
				continue;
			}
			if (opener === documentBlockInstructionByType.module.start) {
				throw new Error(`Parse error at line ${i + 1}: module blocks must be inside an entry block`);
			}
			if (opener === GROUP_BLOCK_DELIMITER.opener) {
				throw new Error(`Parse error at line ${i + 1}: group blocks must be inside an entry block`);
			}
			i = readProjectCodeBlock(i, codeBlocks);
			continue;
		}

		const entryName = getProjectBlockName(trimmed, i + 1, 'entry');
		if (seenEntryNames.has(entryName)) {
			throw new Error(`Parse error at line ${i + 1}: duplicate entry "${entryName}"`);
		}
		seenEntryNames.add(entryName);

		i = readProjectContainerContents(i + 1, {
			entry: entryName,
			container: ENTRY_BLOCK_DELIMITER,
			codeBlocks,
			groups,
			validateDocumentOpener: (innerOpener, line, lineNumber) => {
				if (innerOpener !== documentBlockInstructionByType.module.start) {
					throw new Error(
						`Parse error at line ${lineNumber}: entry "${entryName}" can only contain module or group blocks, got "${line}"`
					);
				}
			},
		});
	}

	return {
		codeBlocks,
		groups,
		...(includedFunctionBlocks.length > 0 ? { includedFunctionBlocks } : {}),
	};
}

/**
 * Parses 8f4e project with async include source resolution.
 *
 * @param text - Project source text to parse.
 * @returns Parsed 8f4e project.
 */
export async function parse8f4eProjectAsync(
	text: string,
	options: Parse8f4eProjectAsyncOptions = {}
): Promise<ProjectInput> {
	if (!options.resolveInclude) {
		return parse8f4eProject(text);
	}

	const includeSources = new Map<string, string | undefined>();
	for (const includeId of new Set(collectProjectIncludeIds(text))) {
		includeSources.set(includeId, await options.resolveInclude(includeId));
	}

	return parse8f4eProject(text, {
		resolveInclude: includeId => includeSources.get(includeId),
	});
}

export default parse8f4eProject;
