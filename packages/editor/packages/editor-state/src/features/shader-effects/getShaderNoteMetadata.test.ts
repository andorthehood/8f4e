import { describe, expect, it } from 'vitest';
import getShaderNoteMetadata from './getShaderNoteMetadata';

describe('getShaderNoteMetadata', () => {
	it('parses fragment postprocess shader notes', () => {
		expect(getShaderNoteMetadata(['note fragmentShaderPostprocess', 'noteEnd'])).toEqual({
			shaderType: 'fragment',
			target: 'postprocess',
			subtype: 'fragmentShaderPostprocess',
		});
	});

	it('parses vertex background shader notes', () => {
		expect(getShaderNoteMetadata(['note vertexShaderBackground', 'noteEnd'])).toEqual({
			shaderType: 'vertex',
			target: 'background',
			subtype: 'vertexShaderBackground',
		});
	});

	it('ignores plain notes and unknown subtypes', () => {
		expect(getShaderNoteMetadata(['note', 'noteEnd'])).toBeNull();
		expect(getShaderNoteMetadata(['note todo', 'noteEnd'])).toBeNull();
	});
});
