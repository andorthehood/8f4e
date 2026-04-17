import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';

export type ParsedNumericLiteralToken = {
	value: number;
	isInteger: boolean;
	isFloat64?: boolean;
	isHex?: boolean;
};

export function startsWithNumericPrefix(argument: string): boolean {
	return /^-?(?:\d|\.\d)/.test(argument);
}

export function isNumericLikeInvalidToken(argument: string): boolean {
	return (
		startsWithNumericPrefix(argument) &&
		(/[*/]/.test(argument) ||
			argument.includes('.') ||
			/[eE]/.test(argument) ||
			/^-?0[xXbB]/.test(argument) ||
			/[fF]\d*$/.test(argument))
	);
}

export default function parseNumericLiteralToken(argument: string): ParsedNumericLiteralToken | null {
	if (/^-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?\d+)?f64$/.test(argument)) {
		const value = parseFloat(argument.slice(0, -3));
		if (!Number.isFinite(value)) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_NUMERIC_LITERAL, `Invalid numeric literal: ${argument}`);
		}
		return { value, isInteger: false, isFloat64: true };
	}

	if (/^-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?\d+)?$/.test(argument)) {
		const value = parseFloat(argument);
		if (!Number.isFinite(value)) {
			throw new SyntaxRulesError(SyntaxErrorCode.INVALID_NUMERIC_LITERAL, `Invalid numeric literal: ${argument}`);
		}
		return {
			value,
			isInteger: /^-?[0-9]+$/.test(argument),
		};
	}

	if (/^-?0x[0-9a-fA-F]+$/.test(argument)) {
		return {
			value: parseInt(argument.replace('0x', ''), 16),
			isInteger: true,
			isHex: true,
		};
	}

	if (/^-?0b[0-1]+$/.test(argument)) {
		return { value: parseInt(argument.replace('0b', ''), 2), isInteger: true };
	}

	return null;
}
