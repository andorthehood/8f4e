import {
	unsignedLEB128,
	createFunctionSection,
	createTypeSection,
	createFunctionType,
	createExportSection,
	createFunctionExport,
	createCodeSection,
	createFunctionBody,
	createLocalDeclaration,
	createMemorySection,
	createNameSection,
	createFunctioName,
	Type,
	i32load,
	i32store,
	i32const,
	createImportSection,
	createMemoryImport,
	localGet,
	createModuloFunction,
} from './utils';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const compile = function () {
	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([
			createFunctionType([Type.I32, Type.I32], [Type.I32]),
			createFunctionType([Type.I32]),
			createFunctionType([], [Type.I32]),
		]),
		...createImportSection([createMemoryImport('js', 'memory')]),
		...createFunctionSection([0x00, 0x01, 0x02, 0x00]),
		//...createMemorySection(10),
		...createExportSection([
			createFunctionExport('channel1', 0x02),
			createFunctionExport('setRate', 0x01),
			createFunctionExport('getRate', 0x02),
			createFunctionExport('modulo', 0x03),
		]),
		...createCodeSection([
			createFunctionBody([], [...i32const(1)]),
			createFunctionBody([], [...i32const(0), ...localGet(0), ...i32store(), ...i32store(4, 10), ...i32store(8, 22)]),
			createFunctionBody(
				//[createLocalDeclaration(Type.I32)],
				[],
				[...i32load(0)]
			),
			createModuloFunction(),
		]),
		...createNameSection([
			createFunctioName(0x00, 'channel1'),
			createFunctioName(0x01, 'setRate'),
			createFunctioName(0x02, 'getRate'),
			createFunctioName(0x03, 'modulo'),
		]),
	]);
};

export default compile;
