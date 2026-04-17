import { describe, expect, it } from 'vitest';

import parseConstantMulDivExpression from './parseConstantMulDivExpression';

describe('parseConstantMulDivExpression', () => {
	it('parses constant * literal', () => {
		expect(parseConstantMulDivExpression('SIZE*2')).toEqual({
			lhs: 'SIZE',
			operator: '*',
			rhs: '2',
		});
	});

	it('parses constant / literal', () => {
		expect(parseConstantMulDivExpression('SIZE/2')).toEqual({
			lhs: 'SIZE',
			operator: '/',
			rhs: '2',
		});
	});

	it('parses literal * constant', () => {
		expect(parseConstantMulDivExpression('2*SIZE')).toEqual({
			lhs: '2',
			operator: '*',
			rhs: 'SIZE',
		});
	});

	it('parses metadata query * literal', () => {
		expect(parseConstantMulDivExpression('sizeof(name)*2')).toEqual({
			lhs: 'sizeof(name)',
			operator: '*',
			rhs: '2',
		});
	});

	it('parses literal * metadata query', () => {
		expect(parseConstantMulDivExpression('123*sizeof(name)')).toEqual({
			lhs: '123',
			operator: '*',
			rhs: 'sizeof(name)',
		});
	});

	it('parses metadata query with pointee form', () => {
		expect(parseConstantMulDivExpression('sizeof(*ptr)*4')).toEqual({
			lhs: 'sizeof(*ptr)',
			operator: '*',
			rhs: '4',
		});
	});

	it('parses constant * metadata query', () => {
		expect(parseConstantMulDivExpression('SIZE*sizeof(name)')).toEqual({
			lhs: 'SIZE',
			operator: '*',
			rhs: 'sizeof(name)',
		});
	});

	it('rejects multiple operators outside parens', () => {
		expect(parseConstantMulDivExpression('SIZE/2/2')).toBeNull();
		expect(parseConstantMulDivExpression('SIZE*2/2')).toBeNull();
	});

	it('rejects operators at start or end', () => {
		expect(parseConstantMulDivExpression('*SIZE')).toBeNull();
		expect(parseConstantMulDivExpression('SIZE*')).toBeNull();
	});

	it('returns null for plain identifiers or literals', () => {
		expect(parseConstantMulDivExpression('SIZE')).toBeNull();
		expect(parseConstantMulDivExpression('42')).toBeNull();
		expect(parseConstantMulDivExpression('sizeof(name)')).toBeNull();
	});

	it('counts operators inside parentheses as non-operators', () => {
		// sizeof(*name) has a * inside parens — should not count as operator
		expect(parseConstantMulDivExpression('sizeof(*name)')).toBeNull();
	});
});
