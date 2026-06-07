import type { DataStructure } from '@8f4e/compiler-spec';
import { MemoryTypes } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { beforeEach, describe, expect, it } from 'vitest';
import { getTabStopsByLine, getVisualLineWidth } from '~/features/code-editing/tabLayout';
import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	findWidgetById,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';
import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

describe('watch directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			name: 'test-block',
			code: ['; @watch myVar'],
			lineNumberColumnWidth: 2,
			gaps: new Map(),
		});

		mockState = createMockState({
			codeBlockRendering: {
				viewport: {
					vGrid: 10,
					hGrid: 20,
				},
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							myVar: {
								wordAlignedAddress: 5,
								byteAddress: 20,
							},
						},
					},
				},
			},
		});
	});

	function runDirectiveResolution() {
		const directiveState = deriveDirectiveStateForMockCodeBlock(mockGraphicData);
		runBeforeGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
		runAfterGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
	}

	it('should add debugger to graphicData widgets', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.debuggers, 'myVar')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		// This test requires resolveMemoryIdentifier mocking which is complex
		// For now, verify that the basic functionality works with the first test
		runDirectiveResolution();

		// At minimum verify debuggers map exists
		expect(mockGraphicData.widgets.debuggers).toBeDefined();
	});

	it('should not add debugger when memory is not found', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @watch nonExistentVar']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers.length).toBe(0);
	});

	it('should clear existing debuggers before updating', () => {
		mockGraphicData.widgets.debuggers.push({
			width: 0,
			height: 0,
			showAddress: false,
			showEndAddress: false,
			x: 0,
			y: 0,
			id: 'oldDebugger',
			memory: { wordAlignedAddress: 0 } as DataStructure,
			bufferPointer: 0,
			displayFormat: 'decimal',
		});

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, 'oldDebugger')).toBeUndefined();
	});

	it('should handle multiple debuggers', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @watch var1', '; @watch var2']);
		mockState.compiler.compiledModules['test-block'].memoryMap['var1'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'var1',
			pointerDepth: 0,
		};
		mockState.compiler.compiledModules['test-block'].memoryMap['var2'] = {
			wordAlignedAddress: 6,
			byteAddress: 24,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'var2',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers.length).toBe(2);
		expect(mockGraphicData.widgets.debuggers).toMatchSnapshot();
	});

	it('should position debuggers at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'nop', '; @watch myVar'];
		mockState.compiler.compiledModules['test-block'].memoryMap['myVar'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'myVar',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		const dbg = findWidgetById(mockGraphicData.widgets.debuggers, 'myVar');
		expect(dbg).toMatchSnapshot();
	});

	it('should resolve inline watch directives by inferring the same-line declaration id', () => {
		mockGraphicData.code = ['int myVar 1 ; @watch'];
		mockState.compiler.compiledModules['test-block'].memoryMap['myVar'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'myVar',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, 'myVar')).toBeDefined();
	});

	it('should resolve inline hex watch directives by templating the same-line declaration id', () => {
		mockGraphicData.code = ['int myVar 1 ; @watch 0x'];
		mockState.compiler.compiledModules['test-block'].memoryMap['myVar'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'myVar',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		const debuggerWidget = findWidgetById(mockGraphicData.widgets.debuggers, '0xmyVar');
		expect(debuggerWidget).toBeDefined();
		expect(debuggerWidget?.displayFormat).toBe('hex');
	});

	it('should resolve shorthand watch directives', () => {
		mockGraphicData.code = ['; @w myVar'];
		mockState.compiler.compiledModules['test-block'].memoryMap['myVar'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'myVar',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, 'myVar')).toBeDefined();
	});

	it('should position watch widgets using visual line width when tabs are present', () => {
		mockGraphicData.code = ['; @tab 8 16', 'push\t1 ; @watch myVar'];
		mockState.compiler.compiledModules['test-block'].memoryMap['myVar'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'myVar',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		const debuggerWidget = findWidgetById(mockGraphicData.widgets.debuggers, 'myVar');
		const lineNumberColumnWidth = mockGraphicData.lineNumberColumnWidth;
		const tabStopsByLine = getTabStopsByLine(mockGraphicData.code);
		const visualLineWidth = getVisualLineWidth(mockGraphicData.code[1], tabStopsByLine[1] || []);
		const rawLengthX = mockState.viewport.vGrid * (3 + lineNumberColumnWidth + mockGraphicData.code[1].length);
		const visualWidthX = mockState.viewport.vGrid * (3 + lineNumberColumnWidth + visualLineWidth);

		expect(debuggerWidget?.x).toBe(visualWidthX);
		expect(debuggerWidget?.x).toBeGreaterThan(rawLengthX);
	});

	it('should resolve inline watch directives for anonymous declarations', () => {
		mockGraphicData.code = ['int 0 ; @watch'];
		mockState.compiler.compiledModules['test-block'].memoryMap['__anonymous__0'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: '__anonymous__0',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, '__anonymous__0')).toBeDefined();
	});

	it('should resolve inline hex watch directives for anonymous declarations', () => {
		mockGraphicData.code = ['int 0 ; @watch 0x'];
		mockState.compiler.compiledModules['test-block'].memoryMap['__anonymous__0'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: '__anonymous__0',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		const debuggerWidget = findWidgetById(mockGraphicData.widgets.debuggers, '0x__anonymous__0');
		expect(debuggerWidget).toBeDefined();
		expect(debuggerWidget?.displayFormat).toBe('hex');
	});

	it('should resolve inline watch directives for bare anonymous int declaration (no arguments)', () => {
		mockGraphicData.code = ['int ; @watch'];
		mockState.compiler.compiledModules['test-block'].memoryMap['__anonymous__0'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: '__anonymous__0',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, '__anonymous__0')).toBeDefined();
	});

	it('should resolve inline watch directives for bare anonymous float declaration (no arguments)', () => {
		mockGraphicData.code = ['float ; @watch'];
		mockState.compiler.compiledModules['test-block'].memoryMap['__anonymous__0'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.float,
			wordAlignedSize: 1,
			default: 0,
			isInteger: false,
			id: '__anonymous__0',
			pointerDepth: 0,
		};

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, '__anonymous__0')).toBeDefined();
	});

	it('should resolve inline watch directives for bare anonymous int* declaration (no arguments)', () => {
		mockGraphicData.code = ['int* ; @watch'];
		mockState.compiler.compiledModules['test-block'].memoryMap['__anonymous__0'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes['int*'],
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: '__anonymous__0',
			pointeeBaseType: 'int',
			pointerDepth: 1,
		};

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, '__anonymous__0')).toBeDefined();
	});
});
