/**
 * Extracts the module and memory identifiers from an inter-modular element max reference.
 * Example: "max(module:buffer)" -> { module: "module", memory: "buffer" }
 */
export default function extractIntermodularElementMaxBase(value: string): {
	module: string;
	memory: string;
} {
	// Remove leading "max(" and trailing ")"
	const inner = value.slice(4, -1);
	const [module, memory] = inner.split(':');
	return { module, memory };
}
