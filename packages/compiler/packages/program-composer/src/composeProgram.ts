import {
	type CompilerCache,
	createChildProjectGroupPath,
	createProjectModuleId,
	type ProjectConstantScopeLine,
	type ProjectGroupPath,
	type ProjectObjectModel,
	ROOT_PROJECT_GROUP_PATH,
	type ValidatedAST,
	type ValidatedConstantsAST,
	type ValidatedFunctionAST,
	type ValidatedModuleAST,
	type ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { parseLine, SyntaxRulesError } from '@8f4e/tokenizer';
import { compileSourceToAST, createCompilerSource } from './compilerSource';
import { createCompilerCache } from './createCompilerCache';
import { qualifyAst } from './qualifyAst';
import type { ComposedProgram, IncludedFunctionsByProjectGroupPath } from './types';

function collectProjectConstantScopeLines(
	code: readonly string[],
	projectPath: ProjectGroupPath
): ProjectConstantScopeLine[] {
	const lines: ProjectConstantScopeLine[] = [];
	for (const [index, sourceLine] of code.entries()) {
		if (!/^\s*(?:const|pass)(?:\s|$)/.test(sourceLine)) {
			continue;
		}

		try {
			lines.push(parseLine(sourceLine, index) as ProjectConstantScopeLine);
		} catch (error) {
			if (error instanceof SyntaxRulesError) {
				error.context = { ...error.context, projectGroupPath: projectPath };
			}
			throw error;
		}
	}
	return lines;
}

function appendMemoryExposureAliases(
	program: ComposedProgram,
	groupPath: ProjectGroupPath,
	exposures: ProjectObjectModel['groups'][number]['exposures']
): void {
	if (exposures.length === 0) {
		return;
	}

	const aliases = new Map(program.memoryAliases);
	const groupAliases = new Map(aliases.get(groupPath));

	for (const exposure of exposures) {
		const targetModuleId = createProjectModuleId(groupPath, exposure.targetModuleName);
		program.memoryExposures.push({ ...exposure, groupPath, targetModuleId });
		groupAliases.set(exposure.name, { targetModuleId, targetMemoryId: exposure.targetMemoryName });
	}

	aliases.set(groupPath, groupAliases);
	program.memoryAliases = aliases;
}

function appendUnit(
	project: ProjectObjectModel,
	projectPath: ProjectGroupPath,
	parentProjectPath: ProjectGroupPath | undefined,
	program: ComposedProgram,
	includedFunctionsByProjectPath: IncludedFunctionsByProjectGroupPath
): void {
	program.projectConstantScopes.push({
		groupPath: projectPath,
		...(parentProjectPath !== undefined ? { parentGroupPath: parentProjectPath } : {}),
		lines: collectProjectConstantScopeLines(project.code, projectPath),
	});

	project.groups.forEach(group => {
		const groupPath = createChildProjectGroupPath(projectPath, group.name);
		appendMemoryExposureAliases(program, groupPath, group.exposures);
		appendUnit(group, groupPath, projectPath, program, includedFunctionsByProjectPath);
	});

	const prefix = projectPath === ROOT_PROJECT_GROUP_PATH ? undefined : `${projectPath}/`;
	const qualify = <TAst extends ValidatedAST>(ast: TAst): TAst => (prefix ? qualifyAst(ast, prefix) : ast);
	const prototypes = project.prototypes.filter(block => !block.disabled);
	const modules = project.modules.filter(block => !block.disabled);
	const constants = project.constants.filter(block => !block.disabled);
	const functions = project.functions.filter(block => !block.disabled);
	const includedFunctions = includedFunctionsByProjectPath.get(projectPath) ?? [];

	program.ast.prototypes.push(
		...prototypes.map((prototype, index) =>
			qualify(
				compileSourceToAST<ValidatedPrototypeAST>(
					createCompilerSource(prototype, projectPath, `prototype:${index}`),
					program.cache
				)
			)
		)
	);
	program.ast.constants.push(
		...constants.map((constantsBlock, index) =>
			qualify(
				compileSourceToAST<ValidatedConstantsAST>(
					createCompilerSource(constantsBlock, projectPath, `constants:${index}`),
					program.cache
				)
			)
		)
	);
	program.ast.functions.push(
		...functions.map((func, index) =>
			qualify(
				compileSourceToAST<ValidatedFunctionAST>(
					createCompilerSource(func, projectPath, `function:${index}`),
					program.cache
				)
			)
		),
		...includedFunctions.map((func, index) =>
			qualify(
				compileSourceToAST<ValidatedFunctionAST>(
					createCompilerSource(func, projectPath, `include:function:${index}`),
					program.cache
				)
			)
		)
	);

	const moduleIndexByEntry = new Map<string, number>();
	for (const module of modules) {
		const index = moduleIndexByEntry.get(module.entry) ?? 0;
		moduleIndexByEntry.set(module.entry, index + 1);
		program.ast.modules.push(
			qualify(
				compileSourceToAST<ValidatedModuleAST>(
					createCompilerSource(module, projectPath, `entry:${module.entry}:module:${index}`),
					program.cache
				)
			)
		);
		program.moduleEntryNames.push(module.entry);
		if (!program.entryNames.includes(module.entry)) {
			program.entryNames.push(module.entry);
		}
	}
}

/**
 * Parses and composes a recursive project tree into one globally planned compiler program.
 * Child modules are appended before parent modules, while functions, constants, and prototypes remain hoisted.
 */
export function composeProgram(
	project: ProjectObjectModel,
	cache: CompilerCache = createCompilerCache(),
	includedFunctionsByProjectPath: IncludedFunctionsByProjectGroupPath = new Map()
): ComposedProgram {
	const program: ComposedProgram = {
		entryNames: ['main'],
		moduleEntryNames: [],
		ast: {
			prototypes: [],
			modules: [],
			constants: [],
			functions: [],
		},
		memoryExposures: [],
		memoryAliases: new Map(),
		projectConstantScopes: [],
		cache,
	};

	appendUnit(project, ROOT_PROJECT_GROUP_PATH, undefined, program, includedFunctionsByProjectPath);
	return program;
}
