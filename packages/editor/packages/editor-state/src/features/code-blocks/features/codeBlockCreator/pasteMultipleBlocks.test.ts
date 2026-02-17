import { describe, it, expect } from 'vitest';

import { updateInterModuleReferences } from './pasteMultipleBlocks';

describe('updateInterModuleReferences', () => {
	it('should update start address references (&module.memory)', () => {
		const code = ['init buffer &oscillator.wave 256'];
		const idMapping = new Map([['oscillator', 'oscillator2']]);

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('init buffer &oscillator2.wave 256');
	});

	it('should update end address references (module.memory&)', () => {
		const code = ['init buffer oscillator.wave& 256'];
		const idMapping = new Map([['oscillator', 'oscillator2']]);

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('init buffer oscillator2.wave& 256');
	});

	it('should update element count references ($module.memory)', () => {
		const code = ['init buffer $oscillator.wave'];
		const idMapping = new Map([['oscillator', 'oscillator2']]);

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('init buffer $oscillator2.wave');
	});

	it('should update element word size references (%module.memory)', () => {
		const code = ['init value %oscillator.wave'];
		const idMapping = new Map([['oscillator', 'oscillator2']]);

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('init value %oscillator2.wave');
	});

	it('should update multiple references in the same line', () => {
		const code = ['copy &source.data destination.data& $source.size'];
		const idMapping = new Map([
			['source', 'source2'],
			['destination', 'destination2'],
		]);

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('copy &source2.data destination2.data& $source2.size');
	});

	it('should handle multiple IDs in mapping', () => {
		const code = ['copy &osc1.wave &osc2.wave', 'init buffer $osc1.size'];
		const idMapping = new Map([
			['osc1', 'osc3'],
			['osc2', 'osc4'],
		]);

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('copy &osc3.wave &osc4.wave');
		expect(result[1]).toBe('init buffer $osc3.size');
	});

	it('should not modify code when mapping is empty', () => {
		const code = ['init buffer &oscillator.wave 256'];
		const idMapping = new Map<string, string>();

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('init buffer &oscillator.wave 256');
	});

	it('should not update partial matches', () => {
		const code = ['init buffer &oscillatorMain.wave 256'];
		const idMapping = new Map([['oscillator', 'oscillator2']]);

		const result = updateInterModuleReferences(code, idMapping);

		// Should not change oscillatorMain to oscillator2Main
		expect(result[0]).toBe('init buffer &oscillatorMain.wave 256');
	});

	it('should handle special regex characters in IDs', () => {
		const code = ['init buffer &test.data 256'];
		const idMapping = new Map([['test', 'test2']]);

		const result = updateInterModuleReferences(code, idMapping);

		expect(result[0]).toBe('init buffer &test2.data 256');
	});
});
