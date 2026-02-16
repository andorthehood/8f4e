import { INTERMODULAR_REFERENCE_PATTERN } from './syntax/isIntermodularReferencePattern';
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
						['int*', 'int**', 'float*', 'float**', 'init', 'int'].includes(instruction) &&
						_arguments[0] &&
						_arguments[1] &&
						_arguments[0].type === ArgumentType.IDENTIFIER &&
						_arguments[1].type === ArgumentType.IDENTIFIER &&
						INTERMODULAR_REFERENCE_PATTERN.test(_arguments[1].value)
					);
				})
				.map(({ arguments: _arguments }) => {
					const value = _arguments[1].value as string;
					// Remove leading & and trailing & (if present)
					const cleanRef = value.endsWith('&') ? value.substring(1, value.length - 1) : value.substring(1);
					return cleanRef.split('.')[0];
				});

			const intermodulerConnectionsB = astB
				.filter(({ instruction, arguments: _arguments }) => {
					return (
						['int*', 'int**', 'float*', 'float**', 'init', 'int'].includes(instruction) &&
						_arguments[0] &&
						_arguments[1] &&
						_arguments[0].type === ArgumentType.IDENTIFIER &&
						_arguments[1].type === ArgumentType.IDENTIFIER &&
						INTERMODULAR_REFERENCE_PATTERN.test(_arguments[1].value)
					);
				})
				.map(({ arguments: _arguments }) => {
					const value = _arguments[1].value as string;
					// Remove leading & and trailing & (if present)
					const cleanRef = value.endsWith('&') ? value.substring(1, value.length - 1) : value.substring(1);
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
