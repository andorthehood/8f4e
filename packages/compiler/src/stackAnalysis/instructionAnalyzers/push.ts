import type {
	CompilationContext,
	DataStructure,
	LocalBinding,
	NormalizedPushLine,
	PointeeMetadata,
	ResolvedPushLine,
	Stack,
} from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { getMemoryRegionFields } from '../../semantic/memoryRegions';
import { getDereferencedValueKindFromMetadata, getPointerDepthFromMetadata } from '../../utils/memoryData';
import { kindToStackItem, resolveArgumentValueKind, resolveMemoryValueKind } from '../../utils/pushValueKind';
import { createStackValue, produce } from './stack';

function pushLiteralStackItems(line: NormalizedPushLine): Stack {
	const argument = line.arguments[0];

	if (argument.type === ArgumentType.STRING_LITERAL) {
		return Array.from(argument.value, ch => createStackValue('int', { isNonZero: (ch.charCodeAt(0) & 0xff) !== 0 }));
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION || argument.type === ArgumentType.IDENTIFIER) {
		return [];
	}

	const kind = resolveArgumentValueKind(argument);

	return [
		kindToStackItem(kind, {
			isNonZero: argument.value !== 0,
			...(argument.isInteger && Number.isInteger(argument.value) ? { knownIntegerValue: argument.value } : {}),
			...(argument.address
				? {
						address: {
							...argument.address,
							clampRange: argument.address.clampRange ?? argument.address.safeRange,
						},
					}
				: {}),
		}),
	];
}

function getPointeeMetadata(pointerMetadata: DataStructure | LocalBinding): PointeeMetadata | undefined {
	return pointerMetadata.pointeeBaseType
		? {
				baseType: pointerMetadata.pointeeBaseType,
				memoryIndex: pointerMetadata.pointeeMemoryIndex ?? 0,
				...(pointerMetadata.pointeeMemoryRegionName
					? { memoryRegionName: pointerMetadata.pointeeMemoryRegionName }
					: {}),
				pointerDepth: getPointerDepthFromMetadata(pointerMetadata),
				...(pointerMetadata.pointeeElementCount !== undefined
					? { elementCount: pointerMetadata.pointeeElementCount }
					: {}),
			}
		: undefined;
}

function pushDereferencedPointerStackItems(
	line: Extract<ResolvedPushLine, { resolvedTarget: { kind: 'memory-pointer' | 'local-pointer' } }>
): Stack {
	const pointerMetadata =
		line.resolvedTarget.kind === 'memory-pointer'
			? line.resolvedTarget.memoryItem
			: line.resolvedTarget.kind === 'local-pointer'
				? line.resolvedTarget.local
				: undefined;
	if (!pointerMetadata) {
		return [];
	}

	const dereferenceDepth = line.arguments[0].dereferenceDepth;
	const remainingPointerDepth = getPointerDepthFromMetadata(pointerMetadata) - dereferenceDepth;
	if (remainingPointerDepth > 0) {
		return [
			kindToStackItem('int32', {
				isNonZero: false,
				address: getMemoryRegionFields(
					pointerMetadata.pointeeMemoryIndex ?? 0,
					pointerMetadata.pointeeMemoryRegionName
				),
				pointsTo: {
					baseType: pointerMetadata.pointeeBaseType,
					memoryIndex: pointerMetadata.pointeeMemoryIndex ?? 0,
					...(pointerMetadata.pointeeMemoryRegionName
						? { memoryRegionName: pointerMetadata.pointeeMemoryRegionName }
						: {}),
					pointerDepth: remainingPointerDepth,
					...(pointerMetadata.pointeeElementCount !== undefined
						? { elementCount: pointerMetadata.pointeeElementCount }
						: {}),
				},
			}),
		];
	}

	const kind = getDereferencedValueKindFromMetadata(pointerMetadata, dereferenceDepth);
	return [kindToStackItem(kind, { isNonZero: false })];
}

function pushResolvedTargetStackItems(line: ResolvedPushLine): Stack {
	switch (line.resolvedTarget.kind) {
		case 'memory': {
			const { memoryItem } = line.resolvedTarget;
			const kind = resolveMemoryValueKind(memoryItem);
			const pointsTo = getPointeeMetadata(memoryItem);

			return [
				kindToStackItem(kind, {
					isNonZero: false,
					...(pointsTo ? { pointsTo } : {}),
					address: getMemoryRegionFields(memoryItem.memoryIndex ?? 0, memoryItem.memoryRegionName),
				}),
			];
		}
		case 'memory-pointer': {
			return pushDereferencedPointerStackItems(
				line as Extract<ResolvedPushLine, { resolvedTarget: { kind: 'memory-pointer' } }>
			);
		}
		case 'local-pointer': {
			return pushDereferencedPointerStackItems(
				line as Extract<ResolvedPushLine, { resolvedTarget: { kind: 'local-pointer' } }>
			);
		}
		case 'local':
		default: {
			const { local } = line.resolvedTarget;
			const pointsTo = getPointeeMetadata(local);

			return [
				local.pointeeBaseType
					? kindToStackItem('int32', {
							isNonZero: false,
							address: getMemoryRegionFields(local.pointeeMemoryIndex ?? 0, local.pointeeMemoryRegionName),
							...(pointsTo ? { pointsTo } : {}),
						})
					: {
							...createStackValue(local.isInteger ? 'int' : local.isFloat64 ? 'float64' : 'float'),
							isNonZero: false,
						},
			];
		}
	}
}

export function analyzePush(line: NormalizedPushLine, context: CompilationContext): Stack {
	const produced = 'resolvedTarget' in line ? pushResolvedTargetStackItems(line) : pushLiteralStackItems(line);
	produce(context, produced);
	return produced;
}
