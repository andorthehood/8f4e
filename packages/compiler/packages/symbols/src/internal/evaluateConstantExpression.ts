import type { Const } from '../types';

export function evaluateConstantExpression(lhsConst: Const, rhsConst: Const, operator: '*' | '/' | '^'): Const {
	const value =
		operator === '*'
			? lhsConst.value * rhsConst.value
			: operator === '/'
				? lhsConst.value / rhsConst.value
				: Math.pow(lhsConst.value, rhsConst.value);
	const isFloat64 = !!lhsConst.isFloat64 || !!rhsConst.isFloat64;
	const isInteger = !isFloat64 && lhsConst.isInteger && rhsConst.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
	};
}
