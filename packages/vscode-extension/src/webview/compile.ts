import compile, { deriveEffectiveMemorySize, serializeDiagnostic } from '@8f4e/compiler';
import type {
	CompiledModuleLookup,
	CompileInput,
	CompileOptions,
	CompilerCache,
	CompilerDiagnostic,
	MemoryAction,
} from '@8f4e/compiler-spec';
import type { CompilationResult, Editor } from '@8f4e/editor';

let compilerCache: CompilerCache | undefined;
let memoryRef: WebAssembly.Memory | null = null;
let codeBuffer = new Uint8Array();
let currentMemorySize = 0;
let supportsSharedMemoryCache: boolean | undefined;

export function getMemory(): WebAssembly.Memory | null {
	return memoryRef;
}

export function getSharedMemory(): WebAssembly.Memory | null {
	if (!memoryRef || !isSharedMemory(memoryRef)) {
		return null;
	}

	return memoryRef;
}

export function hasSharedMemorySupport(): boolean {
	return supportsSharedMemory();
}

export function getCodeBuffer(): Uint8Array {
	return codeBuffer;
}

export async function compileCode(
	input: CompileInput,
	compilerOptions: CompileOptions,
	editor: Editor
): Promise<CompilationResult> {
	try {
		const result = compile(
			input,
			{
				...compilerOptions,
				disableSharedMemory: !supportsSharedMemory(),
			},
			compilerCache
		);
		compilerCache = result.cache;

		const nextCodeBuffer = new Uint8Array(result.codeBuffer);
		const allocatedMemoryBytes = deriveEffectiveMemorySize(result.requiredMemoryBytes);
		const memoryAction = recreateMemory(allocatedMemoryBytes);
		const currentMemory = memoryRef;
		if (!currentMemory) {
			throw new Error('Cannot compile 8f4e code without a WebAssembly memory.');
		}

		const wasmInstance = await instantiateCode(nextCodeBuffer, currentMemory);
		const initDefaults = wasmInstance.exports.initDefaults as CallableFunction | undefined;

		initDefaults?.();
		codeBuffer = nextCodeBuffer;
		editor.updateMemoryViews(currentMemory);

		return {
			allocatedMemoryBytes,
			astCacheStats: { ...result.cache.ast.stats },
			byteCodeSize: nextCodeBuffer.length,
			codeBuffer: nextCodeBuffer,
			compiledFunctions: result.compiledFunctions,
			compiledModules: result.compiledModules as CompiledModuleLookup,
			hasWasmInstanceBeenReset: true,
			initOnlyReran: false,
			memoryAction,
			requiredMemoryBytes: result.requiredMemoryBytes,
		};
	} catch (error) {
		throw serializeDiagnostic(error) as CompilerDiagnostic;
	}
}

function recreateMemory(allocatedMemoryBytes: number): MemoryAction {
	const previousMemorySize = currentMemorySize;
	const pages = Math.max(1, Math.ceil(allocatedMemoryBytes / 65536));
	const descriptor: WebAssembly.MemoryDescriptor = {
		initial: pages,
		maximum: pages,
	};

	if (supportsSharedMemory()) {
		descriptor.shared = true;
	}

	memoryRef = new WebAssembly.Memory(descriptor);
	currentMemorySize = allocatedMemoryBytes;

	if (previousMemorySize === 0) {
		return { action: 'recreated', reason: { kind: 'no-instance' } };
	}

	return {
		action: 'recreated',
		reason: {
			kind: 'memory-size-changed',
			nextBytes: allocatedMemoryBytes,
			prevBytes: previousMemorySize,
		},
	};
}

function supportsSharedMemory(): boolean {
	if (supportsSharedMemoryCache !== undefined) {
		return supportsSharedMemoryCache;
	}

	if (typeof SharedArrayBuffer === 'undefined') {
		supportsSharedMemoryCache = false;
		return supportsSharedMemoryCache;
	}

	try {
		const testMemory = new WebAssembly.Memory({
			initial: 1,
			maximum: 1,
			shared: true,
		});
		supportsSharedMemoryCache = testMemory.buffer instanceof SharedArrayBuffer;
	} catch {
		supportsSharedMemoryCache = false;
	}

	return supportsSharedMemoryCache;
}

function isSharedMemory(memory: WebAssembly.Memory): boolean {
	return typeof SharedArrayBuffer !== 'undefined' && memory.buffer instanceof SharedArrayBuffer;
}

async function instantiateCode(
	code: Uint8Array<ArrayBuffer>,
	memory: WebAssembly.Memory
): Promise<WebAssembly.Instance> {
	const result = (await WebAssembly.instantiate(code, {
		host: {
			memory,
		},
	})) as WebAssembly.Instance | WebAssembly.WebAssemblyInstantiatedSource;

	return result instanceof WebAssembly.Instance ? result : result.instance;
}
