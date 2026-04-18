import { getDeclarationBaseType } from './getDeclarationBaseType';

export function getDeclarationNonPointerElementWordSize(baseType: ReturnType<typeof getDeclarationBaseType>): 4 | 8 {
	return baseType === 'float64' ? 8 : 4;
}
