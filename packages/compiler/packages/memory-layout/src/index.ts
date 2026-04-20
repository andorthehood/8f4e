export {
	GLOBAL_ALIGNMENT_BOUNDARY,
	type DataStructure,
	type MemoryMap,
	type ModuleLayout,
	type ModuleLayouts,
	MemoryTypes,
	type PublicMemoryLayout,
	type PublicMemoryLayoutModule,
	type PublicMemoryPassResult,
	type PublicMemoryPlan,
} from './types';
export { getDataStructure } from './memory-data/getDataStructure';
export { getDataStructureByteAddress } from './memory-data/getDataStructureByteAddress';
export { getMemoryStringLastByteAddress } from './memory-data/getMemoryStringLastByteAddress';
export { getElementCount } from './memory-data/getElementCount';
export { getElementWordSize } from './memory-data/getElementWordSize';
export { getPointeeElementWordSize } from './memory-data/getPointeeElementWordSize';
export { getElementMaxValue } from './memory-data/getElementMaxValue';
export { getPointeeElementMaxValue } from './memory-data/getPointeeElementMaxValue';
export { getElementMinValue } from './memory-data/getElementMinValue';
export { isMemoryIdentifier } from './memory-data/isMemoryIdentifier';
export { getByteAddressFromWordOffset } from './addresses/getByteAddressFromWordOffset';
export { getEndByteAddress } from './addresses/getEndByteAddress';
export { getModuleEndByteAddress } from './addresses/getModuleEndByteAddress';
export { getAbsoluteWordOffset } from './addresses/getAbsoluteWordOffset';
export { alignAbsoluteWordOffset } from './addresses/alignAbsoluteWordOffset';
export { getMemoryFlags } from './getMemoryFlags';
export { planPublicMemoryNamespace } from './planPublicMemoryNamespace';
export { discoverPublicMemoryModulesFromASTs } from './discoverPublicMemoryModulesFromASTs';
export { createPublicMemoryPassResultFromASTs } from './createPublicMemoryPassResultFromASTs';
export { createPublicMemoryLayoutFromASTs } from './createPublicMemoryLayoutFromASTs';
