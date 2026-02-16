import { INTERMODULAR_REFERENCE_PATTERN } from '../syntax/isIntermodularReferencePattern';
import { ErrorCode, getError } from '../errors';
import { ArgumentType, CompiledModuleLookup } from '../types';

/**
 * Resolves inter-modular connections by finding references like &module.memory
 * and &module.memory& in compiled modules and setting the appropriate memory defaults.
 *
 * This function:
 * - Identifies inter-module references in memory declarations and init instructions
 * - Validates that both the target module and memory exist
 * - Computes the appropriate address (start or end) based on the reference syntax
 * - Updates the local memory's default value with the resolved address
 */
export default function resolveInterModularConnections(compiledModules: CompiledModuleLookup) {
	Object.values(compiledModules).forEach(({ ast, memoryMap }) => {
		ast!.forEach(line => {
			const { instruction, arguments: _arguments } = line;
			if (
				['int*', 'int**', 'float*', 'float**', 'init', 'int'].includes(instruction) &&
				_arguments[0] &&
				_arguments[1] &&
				_arguments[0].type === ArgumentType.IDENTIFIER &&
				_arguments[1].type === ArgumentType.IDENTIFIER &&
				INTERMODULAR_REFERENCE_PATTERN.test(_arguments[1].value)
			) {
				const refValue = _arguments[1].value;
				// Check if this is an end-address reference (ends with &)
				const isEndAddress = refValue.endsWith('&');
				// Remove leading & and trailing & (if present)
				const cleanRef = refValue.substring(1, isEndAddress ? refValue.length - 1 : refValue.length);
				const [targetModuleId, targetMemoryId] = cleanRef.split('.');

				const targetModule = compiledModules[targetModuleId];

				if (!targetModule) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const targetMemory = targetModule.memoryMap[targetMemoryId];

				if (!targetMemory) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const memory = memoryMap[_arguments[0].value];

				if (memory) {
					// Compute start or end address based on syntax
					if (isEndAddress) {
						// End address: byteAddress + (wordAlignedSize - 1) * 4
						memory.default = targetMemory.byteAddress + (targetMemory.wordAlignedSize - 1) * 4;
					} else {
						// Start address
						memory.default = targetMemory.byteAddress;
					}
				}
			}
		});
	});
}
