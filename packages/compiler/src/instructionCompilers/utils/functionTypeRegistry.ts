import type { FunctionTypeRegistry, FunctionTypeSignature } from '@8f4e/compiler-spec';
import type { WasmTypeValue } from '@8f4e/compiler-wasm-utils';
import { createFunctionType } from '@8f4e/compiler-wasm-utils';

function wasmTypeListsEqual(left: WasmTypeValue[], right: WasmTypeValue[]): boolean {
	return left.length === right.length && left.every((type, index) => type === right[index]);
}

export function getOrRegisterFunctionType(registry: FunctionTypeRegistry, signature: FunctionTypeSignature): number {
	const registeredSignature = registry.signatures.find(
		existing =>
			wasmTypeListsEqual(existing.params, signature.params) && wasmTypeListsEqual(existing.results, signature.results)
	);

	if (registeredSignature) {
		return registeredSignature.typeIndex;
	}

	const typeIndex = registry.baseTypeIndex + registry.types.length;
	registry.signatures.push({
		params: [...signature.params],
		results: [...signature.results],
		typeIndex,
	});
	registry.types.push(createFunctionType(signature.params, signature.results));

	return typeIndex;
}
