import type {
	CompilerCache,
	ProjectObjectModel,
	ValidatedAST,
	ValidatedConstantsAST,
	ValidatedFunctionAST,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { compileSourceToAST, createCompilerSource } from './compilerSource';
import { createCompilerCache } from './createCompilerCache';
import { createUnitSymbolPrefix, getChildProjectUnitKey, ROOT_PROJECT_UNIT_KEY } from './projectUnitKey';
import { qualifyAst } from './qualifyAst';
import type { ComposedProgram, IncludedFunctionsByProjectUnit, ProjectUnitKey } from './types';

function appendUnit(
	project: ProjectObjectModel,
	unitKey: ProjectUnitKey,
	program: ComposedProgram,
	includedFunctionsByUnit: IncludedFunctionsByProjectUnit
): void {
	project.groups.forEach((group, index) => {
		appendUnit(group, getChildProjectUnitKey(unitKey, group, index), program, includedFunctionsByUnit);
	});

	const prefix = unitKey === ROOT_PROJECT_UNIT_KEY ? undefined : createUnitSymbolPrefix(unitKey);
	const qualify = <TAst extends ValidatedAST>(ast: TAst): TAst => (prefix ? qualifyAst(ast, prefix) : ast);
	const prototypes = project.prototypes.filter(block => !block.disabled);
	const modules = project.modules.filter(block => !block.disabled);
	const constants = project.constants.filter(block => !block.disabled);
	const functions = project.functions.filter(block => !block.disabled);
	const includedFunctions = includedFunctionsByUnit.get(unitKey) ?? [];

	program.ast.prototypes.push(
		...prototypes.map((prototype, index) =>
			qualify(
				compileSourceToAST<ValidatedPrototypeAST>(
					createCompilerSource(prototype, unitKey, `prototype:${index}`),
					program.cache
				)
			)
		)
	);
	program.ast.constants.push(
		...constants.map((constantsBlock, index) =>
			qualify(
				compileSourceToAST<ValidatedConstantsAST>(
					createCompilerSource(constantsBlock, unitKey, `constants:${index}`),
					program.cache
				)
			)
		)
	);
	program.ast.functions.push(
		...functions.map((func, index) =>
			qualify(
				compileSourceToAST<ValidatedFunctionAST>(
					createCompilerSource(func, unitKey, `function:${index}`),
					program.cache
				)
			)
		),
		...includedFunctions.map((func, index) =>
			qualify(
				compileSourceToAST<ValidatedFunctionAST>(
					createCompilerSource(func, unitKey, `include:function:${index}`),
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
					createCompilerSource(module, unitKey, `entry:${module.entry}:module:${index}`),
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
	includedFunctionsByUnit: IncludedFunctionsByProjectUnit = new Map()
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
		cache,
	};

	appendUnit(project, ROOT_PROJECT_UNIT_KEY, program, includedFunctionsByUnit);
	return program;
}
