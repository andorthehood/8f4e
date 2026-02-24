const FORMAT_HEADER = '8f4e/v1';

export default function parseModuleSource(source: string): string[] {
	const lines = source.split('\n');
	if (lines[0]?.trim() !== FORMAT_HEADER) {
		return lines;
	}

	let startIndex = 1;
	while (startIndex < lines.length && lines[startIndex].trim() === '') {
		startIndex++;
	}

	return lines.slice(startIndex);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseModuleSource', () => {
		it('returns plain module source lines unchanged when no header is present', () => {
			expect(parseModuleSource('module foo\nmoduleEnd')).toEqual(['module foo', 'moduleEnd']);
		});

		it('removes 8f4e/v1 header and following blank lines', () => {
			expect(parseModuleSource('8f4e/v1\n\nmodule foo\nmoduleEnd')).toEqual(['module foo', 'moduleEnd']);
		});
	});
}
