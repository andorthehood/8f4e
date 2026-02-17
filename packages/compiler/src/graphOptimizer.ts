import { INTERMODULAR_REFERENCE_PATTERN } from './syntax/isIntermodularReferencePattern';
import isIntermodularElementCountReference from './syntax/isIntermodularElementCountReference';
import extractIntermodularElementCountBase from './syntax/extractIntermodularElementCountBase';
import isIntermodularElementWordSizeReference from './syntax/isIntermodularElementWordSizeReference';
import extractIntermodularElementWordSizeBase from './syntax/extractIntermodularElementWordSizeBase';
import isIntermodularElementMaxReference from './syntax/isIntermodularElementMaxReference';
import extractIntermodularElementMaxBase from './syntax/extractIntermodularElementMaxBase';
import isIntermodularElementMinReference from './syntax/isIntermodularElementMinReference';
import extractIntermodularElementMinBase from './syntax/extractIntermodularElementMinBase';
import { ArgumentType } from './types';

import type { AST } from './types';

export default function sortModules(modules: AST[]): AST[] {
	// First, separate constants blocks from regular modules
	const constantsBlocks = modules.filter(ast => ast.some(line => line.instruction === 'constants'));
	const regularModules = modules.filter(ast => !ast.some(line => line.instruction === 'constants'));

	// Sort regular modules by ID and dependencies
	const sortedRegularModules = regularModules
		.sort((astA, astB) => {
			const moduleIdA =
				(astA.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0].value as string) || '';
			const moduleIdB =
				(astB.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0].value as string) || '';

			if (moduleIdA < moduleIdB) {
				return -1;
			}
			if (moduleIdA > moduleIdB) {
				return 1;
			}
			return 0;
		})
		.sort((astA, astB) => {
			const moduleIdA =
				(astA.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0].value as string) || '';
			const moduleIdB =
				(astB.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0].value as string) || '';

			const intermodulerConnectionsA = astA
				.filter(({ instruction, arguments: _arguments }) => {
					return (
						['int*', 'int**', 'float*', 'float**', 'init', 'int', 'float'].includes(instruction) &&
						_arguments[0] &&
						_arguments[1] &&
						_arguments[0].type === ArgumentType.IDENTIFIER &&
						_arguments[1].type === ArgumentType.IDENTIFIER &&
						(INTERMODULAR_REFERENCE_PATTERN.test(_arguments[1].value) ||
							isIntermodularElementCountReference(_arguments[1].value) ||
							isIntermodularElementWordSizeReference(_arguments[1].value) ||
							isIntermodularElementMaxReference(_arguments[1].value) ||
							isIntermodularElementMinReference(_arguments[1].value))
					);
				})
				.map(({ arguments: _arguments }) => {
					const value = _arguments[1].value as string;
					// Handle element count reference ($module.memory)
					if (isIntermodularElementCountReference(value)) {
						const { module } = extractIntermodularElementCountBase(value);
						return module;
					}
					// Handle element word size reference (%module.memory)
					if (isIntermodularElementWordSizeReference(value)) {
						const { module } = extractIntermodularElementWordSizeBase(value);
						return module;
					}
					// Handle element max reference (^module.memory)
					if (isIntermodularElementMaxReference(value)) {
						const { module } = extractIntermodularElementMaxBase(value);
						return module;
					}
					// Handle element min reference (!module.memory)
					if (isIntermodularElementMinReference(value)) {
						const { module } = extractIntermodularElementMinBase(value);
						return module;
					}
					// Handle address reference (&module.memory or module.memory&)
					// Parse reference based on form:
					// - Start: &module.memory -> remove leading &
					// - End: module.memory& -> remove trailing &
					const cleanRef = value.endsWith('&')
						? value.substring(0, value.length - 1) // Remove trailing &
						: value.substring(1); // Remove leading &
					return cleanRef.split('.')[0];
				});

			const intermodulerConnectionsB = astB
				.filter(({ instruction, arguments: _arguments }) => {
					return (
						['int*', 'int**', 'float*', 'float**', 'init', 'int', 'float'].includes(instruction) &&
						_arguments[0] &&
						_arguments[1] &&
						_arguments[0].type === ArgumentType.IDENTIFIER &&
						_arguments[1].type === ArgumentType.IDENTIFIER &&
						(INTERMODULAR_REFERENCE_PATTERN.test(_arguments[1].value) ||
							isIntermodularElementCountReference(_arguments[1].value) ||
							isIntermodularElementWordSizeReference(_arguments[1].value) ||
							isIntermodularElementMaxReference(_arguments[1].value) ||
							isIntermodularElementMinReference(_arguments[1].value))
					);
				})
				.map(({ arguments: _arguments }) => {
					const value = _arguments[1].value as string;
					// Handle element count reference ($module.memory)
					if (isIntermodularElementCountReference(value)) {
						const { module } = extractIntermodularElementCountBase(value);
						return module;
					}
					// Handle element word size reference (%module.memory)
					if (isIntermodularElementWordSizeReference(value)) {
						const { module } = extractIntermodularElementWordSizeBase(value);
						return module;
					}
					// Handle element max reference (^module.memory)
					if (isIntermodularElementMaxReference(value)) {
						const { module } = extractIntermodularElementMaxBase(value);
						return module;
					}
					// Handle element min reference (!module.memory)
					if (isIntermodularElementMinReference(value)) {
						const { module } = extractIntermodularElementMinBase(value);
						return module;
					}
					// Handle address reference (&module.memory or module.memory&)
					// Parse reference based on form:
					// - Start: &module.memory -> remove leading &
					// - End: module.memory& -> remove trailing &
					const cleanRef = value.endsWith('&')
						? value.substring(0, value.length - 1) // Remove trailing &
						: value.substring(1); // Remove leading &
					return cleanRef.split('.')[0];
				});

			if (intermodulerConnectionsB.includes(moduleIdA) && !intermodulerConnectionsA.includes(moduleIdB)) {
				return 1;
			} else if (!intermodulerConnectionsB.includes(moduleIdA) && intermodulerConnectionsA.includes(moduleIdB)) {
				return -1;
			} else {
				return 0;
			}
		});

	// Return constants blocks first, then sorted regular modules
	return [...constantsBlocks, ...sortedRegularModules];
}
