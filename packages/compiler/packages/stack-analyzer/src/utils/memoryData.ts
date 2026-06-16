import type {
	MemoryPointerMetadata,
	MemoryValueKind,
	PlannedMemoryDeclaration,
	PointerLocalBinding,
	StackAddress,
} from '@8f4e/compiler-spec';
import { BASE_TYPE_METADATA } from '@8f4e/compiler-spec';

type PointerMetadata =
	| (Pick<PlannedMemoryDeclaration, 'memoryIndex' | 'memoryRegionName' | 'pointeeBaseType' | 'pointerDepth'> &
			Partial<MemoryPointerMetadata>)
	| Pick<
			PointerLocalBinding,
			'pointeeBaseType' | 'pointerDepth' | 'pointeeMemoryIndex' | 'pointeeMemoryRegionName' | 'pointeeElementCount'
	  >
	| {
			pointeeBaseType: NonNullable<StackAddress['pointsTo']>['baseType'];
			pointerDepth: NonNullable<StackAddress['pointsTo']>['pointerDepth'];
			pointeeMemoryIndex: NonNullable<StackAddress['pointsTo']>['memoryIndex'];
			pointeeMemoryRegionName?: NonNullable<StackAddress['pointsTo']>['memoryRegionName'];
			pointeeElementCount?: NonNullable<StackAddress['pointsTo']>['elementCount'];
	  };

function getPointeeBaseTypeMetadata(pointeeBaseType: NonNullable<PointerMetadata['pointeeBaseType']>) {
	return BASE_TYPE_METADATA[pointeeBaseType];
}

export function getPointerDepthFromMetadata(pointerMetadata: PointerMetadata | undefined): number {
	if (!pointerMetadata?.pointeeBaseType) return 0;
	return pointerMetadata.pointerDepth;
}

export function getDereferencedValueKindFromMetadata(
	pointerMetadata: PointerMetadata | undefined,
	dereferenceDepth = getPointerDepthFromMetadata(pointerMetadata)
): MemoryValueKind {
	if (!pointerMetadata?.pointeeBaseType) return 'float32';
	if (dereferenceDepth < getPointerDepthFromMetadata(pointerMetadata)) return BASE_TYPE_METADATA.pointer.valueKind;
	return getPointeeBaseTypeMetadata(pointerMetadata.pointeeBaseType).valueKind;
}
