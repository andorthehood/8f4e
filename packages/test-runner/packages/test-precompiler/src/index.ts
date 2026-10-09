import type { ProjectBlock, ProjectGroupPath, ProjectObjectModel } from '@8f4e/language-spec';
import { createChildProjectGroupPath, ROOT_PROJECT_GROUP_PATH } from '@8f4e/language-spec';
import { compileToAST, SyntaxRulesError } from '@8f4e/tokenizer';
import { appendSiteId } from './appendSiteId';

/** Original source location of one static `call assert` instruction. */
export interface AssertionSite {
	/** Zero-based ID scoped to this precompilation result. */
	siteId: number;
	projectBlockId: number;
	projectGroupPath: ProjectGroupPath;
	codeBlockType: 'module' | 'function';
	/** Source-level module or function name, before compiler qualification. */
	codeBlockId: string;
	/** Zero-based physical line index within the original code block. */
	lineNumber: number;
}

export interface TestPrecompileResult {
	project: ProjectObjectModel;
	/** Indexed by the site ID appended to each assertion call. */
	assertionSites: AssertionSite[];
}

function copyBlock<T extends ProjectBlock>(block: T): T {
	return { ...block, code: [...block.code] };
}

/**
 * Appends one integer site ID to every enabled module/function `call assert` in a project tree.
 * Run once on the original project before injecting three-parameter assertion declarations and compiling.
 * The original project and physical source line positions are preserved. Includes are left unresolved.
 */
export function precompileTestProject(project: ProjectObjectModel): TestPrecompileResult {
	const assertionSites: AssertionSite[] = [];

	function instrumentBlock<T extends ProjectBlock>(block: T, projectGroupPath: ProjectGroupPath): T {
		const result = copyBlock(block);
		if (block.disabled) return result;
		// The tokenizer consumes line contents; CRLF carriage returns are not part of an instruction.
		result.code = result.code.map(line => (line.endsWith('\r') ? line.slice(0, -1) : line));
		let ast: ReturnType<typeof compileToAST>;
		try {
			ast = compileToAST(result.code);
		} catch (error) {
			if (error instanceof SyntaxRulesError) {
				error.context = { ...error.context, projectBlockId: block.id, projectGroupPath };
			}
			throw error;
		}
		if (ast.type !== 'module' && ast.type !== 'function') return result;

		for (const [index, line] of ast.lines.entries()) {
			if (line.instruction !== 'call' || line.arguments[0].value !== 'assert') continue;
			const siteId = assertionSites.length;
			assertionSites.push({
				siteId,
				projectBlockId: block.id,
				projectGroupPath,
				codeBlockType: ast.type,
				codeBlockId: ast.type === 'module' ? ast.id : ast.name,
				lineNumber: line.lineNumber,
			});
			appendSiteId(result.code, line.lineNumber, ast.lines[index + 1]?.lineNumber ?? block.code.length, siteId);
		}
		return result;
	}

	function instrumentProject(project: ProjectObjectModel, groupPath: ProjectGroupPath): ProjectObjectModel {
		return {
			...project,
			code: [...project.code],
			modules: project.modules.map(block => instrumentBlock(block, groupPath)),
			functions: project.functions.map(block => instrumentBlock(block, groupPath)),
			constants: project.constants.map(copyBlock),
			prototypes: project.prototypes.map(copyBlock),
			includes: project.includes.map(copyBlock),
			notes: project.notes.map(copyBlock),
			unknown: project.unknown.map(copyBlock),
			groups: project.groups.map(group => ({
				...group,
				...instrumentProject(group, createChildProjectGroupPath(groupPath, group.name)),
				exposures: group.exposures.map(exposure => ({ ...exposure })),
			})),
		};
	}

	return { project: instrumentProject(project, ROOT_PROJECT_GROUP_PATH), assertionSites };
}
