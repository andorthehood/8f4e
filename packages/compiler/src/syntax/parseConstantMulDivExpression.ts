import isConstantName from './isConstantName';

export type ConstantMulDivExpression = {
	baseIdentifier: string;
	operator: '*' | '/';
	rhs: string;
};

function getFirstOperatorIndex(value: string): number {
	const mulIndex = value.indexOf('*');
	const divIndex = value.indexOf('/');

	if (mulIndex === -1) {
		return divIndex;
	}

	if (divIndex === -1) {
		return mulIndex;
	}

	return Math.min(mulIndex, divIndex);
}

export default function parseConstantMulDivExpression(value: string): ConstantMulDivExpression | null {
	const operators = value.match(/[*/]/g);

	// Constant expressions support exactly one operator: CONST*number or CONST/number
	if (!operators || operators.length !== 1) {
		return null;
	}

	const operatorIndex = getFirstOperatorIndex(value);

	if (operatorIndex <= 0 || operatorIndex === value.length - 1) {
		return null;
	}

	const operator = value[operatorIndex] as ConstantMulDivExpression['operator'];
	const baseIdentifier = value.slice(0, operatorIndex);
	const rhs = value.slice(operatorIndex + 1);

	if (!isConstantName(baseIdentifier)) {
		return null;
	}

	return {
		baseIdentifier,
		operator,
		rhs,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseConstantMulDivExpression', () => {
		it('parses multiplication expressions', () => {
			expect(parseConstantMulDivExpression('SIZE*2')).toEqual({
				baseIdentifier: 'SIZE',
				operator: '*',
				rhs: '2',
			});
		});

		it('parses division expressions', () => {
			expect(parseConstantMulDivExpression('SIZE/2')).toEqual({
				baseIdentifier: 'SIZE',
				operator: '/',
				rhs: '2',
			});
		});

		it('rejects multiple operators', () => {
			expect(parseConstantMulDivExpression('SIZE/2/2')).toBeNull();
			expect(parseConstantMulDivExpression('SIZE*2/2')).toBeNull();
		});

		it('rejects non-constant lhs identifiers', () => {
			expect(parseConstantMulDivExpression('size/2')).toBeNull();
		});
	});
}
