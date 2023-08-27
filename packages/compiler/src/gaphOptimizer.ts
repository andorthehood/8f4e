import { AST, ArgumentType } from './types';

export function sortModules(modules: AST[]): AST[] {
	return modules
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
						/&(\S+)\.(\S+)/.test(_arguments[1].value)
					);
				})
				.map(({ arguments: _arguments }) => {
					const value = _arguments[1].value as string;
					return value.split('.')[0].substring(1);
				});

			const intermodulerConnectionsB = astB
				.filter(({ instruction, arguments: _arguments }) => {
					return (
						['int*', 'int**', 'float*', 'float**', 'init', 'int'].includes(instruction) &&
						_arguments[0] &&
						_arguments[1] &&
						_arguments[0].type === ArgumentType.IDENTIFIER &&
						_arguments[1].type === ArgumentType.IDENTIFIER &&
						/&(\S+)\.(\S+)/.test(_arguments[1].value)
					);
				})
				.map(({ arguments: _arguments }) => {
					const value = _arguments[1].value as string;
					return value.split('.')[0].substring(1);
				});

			if (intermodulerConnectionsB.includes(moduleIdA) && !intermodulerConnectionsA.includes(moduleIdB)) {
				return 1;
			} else if (!intermodulerConnectionsB.includes(moduleIdA) && intermodulerConnectionsA.includes(moduleIdB)) {
				return -1;
			} else {
				return 0;
			}
		});
}
