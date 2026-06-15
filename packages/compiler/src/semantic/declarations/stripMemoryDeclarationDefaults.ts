import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { isNamedScalarMemoryDeclarationLine } from '@8f4e/compiler-spec';

/** Removes scalar default arguments while namespace discovery is collecting declarations. */
export default function stripMemoryDeclarationDefaults(line: MemoryDeclarationLine): MemoryDeclarationLine {
	if (!isNamedScalarMemoryDeclarationLine(line)) {
		return line;
	}

	const [identifier] = line.arguments;
	return {
		...line,
		arguments: [identifier],
	};
}
