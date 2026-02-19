import { getElementMaxValue, getElementMinValue } from './memoryData';

import { INTERMODULAR_REFERENCE_PATTERN } from '../syntax/isIntermodularReferencePattern';
import isIntermodularElementCountReference from '../syntax/isIntermodularElementCountReference';
import extractIntermodularElementCountBase from '../syntax/extractIntermodularElementCountBase';
import isIntermodularElementWordSizeReference from '../syntax/isIntermodularElementWordSizeReference';
import extractIntermodularElementWordSizeBase from '../syntax/extractIntermodularElementWordSizeBase';
import isIntermodularElementMaxReference from '../syntax/isIntermodularElementMaxReference';
import extractIntermodularElementMaxBase from '../syntax/extractIntermodularElementMaxBase';
import isIntermodularElementMinReference from '../syntax/isIntermodularElementMinReference';
import extractIntermodularElementMinBase from '../syntax/extractIntermodularElementMinBase';
import { ErrorCode, getError } from '../errors';
import { ArgumentType, CompiledModuleLookup } from '../types';

/**
 * Resolves inter-modular connections by finding references like &module.memory,
 * module.memory&, $module.memory, %module.memory, ^module.memory, and !module.memory in compiled modules and setting the appropriate memory defaults.
 *
 * This function:
 * - Identifies inter-module references in memory declarations and init instructions
 * - Validates that both the target module and memory exist
 * - Computes the appropriate value based on the reference syntax:
 *   - &module.memory: start address (byteAddress)
 *   - module.memory&: end address (byteAddress + (wordAlignedSize - 1) * 4)
 *   - $module.memory: element count (wordAlignedSize)
 *   - %module.memory: element word size (elementWordSize)
 *   - ^module.memory: element max value (computed based on target memory type)
 *   - !module.memory: element min value (computed based on target memory type)
 * - Updates the local memory's default value with the resolved value
 */
export default function resolveInterModularConnections(compiledModules: CompiledModuleLookup) {
	Object.values(compiledModules).forEach(({ ast, memoryMap }) => {
		ast!.forEach(line => {
			const { instruction, arguments: _arguments } = line;
			if (
				['int*', 'int**', 'float*', 'float**', 'float64', 'float64*', 'float64**', 'init', 'int', 'float'].includes(
					instruction
				) &&
				_arguments[0] &&
				_arguments[1] &&
				_arguments[0].type === ArgumentType.IDENTIFIER &&
				_arguments[1].type === ArgumentType.IDENTIFIER
			) {
				const refValue = _arguments[1].value;

				// Handle inter-module address references (&module.memory or module.memory&)
				if (INTERMODULAR_REFERENCE_PATTERN.test(refValue)) {
					// Check if this is an end-address reference (ends with &)
					const isEndAddress = refValue.endsWith('&');
					// Parse reference based on form:
					// - Start: &module.memory -> remove leading &
					// - End: module.memory& -> remove trailing &
					const cleanRef = isEndAddress
						? refValue.substring(0, refValue.length - 1) // Remove trailing &
						: refValue.substring(1); // Remove leading &
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
				} else if (isIntermodularElementCountReference(refValue)) {
					// Handle inter-module element count references ($module.memory)
					const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementCountBase(refValue);

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
						// Set element count (wordAlignedSize)
						memory.default = targetMemory.wordAlignedSize;
					}
				} else if (isIntermodularElementWordSizeReference(refValue)) {
					// Handle inter-module element word size references (%module.memory)
					const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementWordSizeBase(refValue);

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
						// Set element word size (elementWordSize)
						memory.default = targetMemory.elementWordSize;
					}
				} else if (isIntermodularElementMaxReference(refValue)) {
					// Handle inter-module element max references (^module.memory)
					const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMaxBase(refValue);

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
						// Set element max value (computed based on target memory type)
						memory.default = getElementMaxValue(targetModule.memoryMap, targetMemoryId);
					}
				} else if (isIntermodularElementMinReference(refValue)) {
					// Handle inter-module element min references (!module.memory)
					const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMinBase(refValue);

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
						// Set element min value (computed based on target memory type)
						memory.default = getElementMinValue(targetModule.memoryMap, targetMemoryId);
					}
				}
			}
		});
	});
}
