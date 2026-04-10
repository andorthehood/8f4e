export interface ShaderNoteMetadata {
	shaderType: 'vertex' | 'fragment';
	target: 'postprocess' | 'background';
	subtype: string;
}

const SHADER_NOTE_SUBTYPES: Record<string, ShaderNoteMetadata> = {
	vertexShaderPostprocess: {
		shaderType: 'vertex',
		target: 'postprocess',
		subtype: 'vertexShaderPostprocess',
	},
	fragmentShaderPostprocess: {
		shaderType: 'fragment',
		target: 'postprocess',
		subtype: 'fragmentShaderPostprocess',
	},
	vertexShaderBackground: {
		shaderType: 'vertex',
		target: 'background',
		subtype: 'vertexShaderBackground',
	},
	fragmentShaderBackground: {
		shaderType: 'fragment',
		target: 'background',
		subtype: 'fragmentShaderBackground',
	},
};

export default function getShaderNoteMetadata(code: string[]): ShaderNoteMetadata | null {
	const header = code[0]?.trim() ?? '';

	if (!header.startsWith('note ')) {
		return null;
	}

	const [, subtype = ''] = header.split(/\s+/, 2);
	return SHADER_NOTE_SUBTYPES[subtype] ?? null;
}

export function isShaderNoteCode(code: string[]): boolean {
	return getShaderNoteMetadata(code) !== null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

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
}
