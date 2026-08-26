import {
	type CompilerCache,
	createChildProjectGroupPath,
	createProjectModuleId,
	type ProjectGroupPath,
	type ProjectObjectModel,
	ROOT_PROJECT_GROUP_PATH,
	type ValidatedAST,
	type ValidatedConstantsAST,
	type ValidatedFunctionAST,
	type ValidatedModuleAST,
	type ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { compileSourceToAST, createCompilerSource } from './compilerSource';
import { createCompilerCache } from './createCompilerCache';
import { qualifyAst } from './qualifyAst';
import { rewriteMemoryExposureReferences } from './rewriteMemoryExposureReferences';
import type { ComposedProgram, IncludedFunctionsByProjectGroupPath } from './types';

function appendUnit(
	project: ProjectObjectModel,
	projectPath: ProjectGroupPath,
	program: ComposedProgram,
	includedFunctionsByProjectPath: IncludedFunctionsByProjectGroupPath
): void {
	project.groups.forEach(group => {
		const groupPath = createChildProjectGroupPath(projectPath, group.name);
		program.memoryExposures.push(
			...group.exposures.map(exposure => ({
				...exposure,
				groupPath,
				targetModuleId: createProjectModuleId(groupPath, exposure.targetModuleName),
			}))
		);
		appendUnit(group, groupPath, program, includedFunctionsByProjectPath);
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
		cache,
	};

	appendUnit(project, ROOT_PROJECT_GROUP_PATH, program, includedFunctionsByProjectPath);
	program.ast = {
		prototypes: rewriteMemoryExposureReferences(program.ast.prototypes, program.memoryExposures),
		modules: rewriteMemoryExposureReferences(program.ast.modules, program.memoryExposures),
		constants: rewriteMemoryExposureReferences(program.ast.constants, program.memoryExposures),
		functions: rewriteMemoryExposureReferences(program.ast.functions, program.memoryExposures),
	};
	return program;
}
