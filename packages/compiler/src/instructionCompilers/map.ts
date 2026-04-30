import { ArgumentType } from '@8f4e/compiler-types';

import { ErrorCode, getError } from '../compilerError';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, NormalizedMapLine } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `map`.
 * Records a key→value mapping entry within a map block. No bytecode is emitted;
 * lowering happens at `mapEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const map: InstructionCompiler<NormalizedMapLine> = withValidation<NormalizedMapLine>(
	{
		scope: 'map',
		allowedInMapBlocks: true,
	},
	(line: NormalizedMapLine, context) => {
		const mapState = context.blockStack[context.blockStack.length - 1].mapState!;
		const keyArg = line.arguments[0];
		const valueArg = line.arguments[1];

		// Resolve key argument
		// The semantic pass (normalizeCompileTimeArguments) guarantees keyArg is LITERAL or STRING_LITERAL.
		let keyValue: number;
		let keyIsInteger: boolean;
		let keyIsFloat64 = false;

		if (keyArg.type === ArgumentType.LITERAL) {
			keyValue = keyArg.value;
			keyIsInteger = keyArg.isInteger;
			keyIsFloat64 = !!keyArg.isFloat64;
		} else {
			keyValue = keyArg.value.charCodeAt(0);
			keyIsInteger = true;
		}

		// Validate key type against the declared inputType
		if (mapState.inputIsFloat64) {
			if (keyIsInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}
			if (!keyIsFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		} else if (mapState.inputIsInteger) {
			if (!keyIsInteger) {
				throw getError(ErrorCode.ONLY_INTEGERS, line, context);
			}
		} else {
			// float32
			if (keyIsInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}
			if (keyIsFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		}

		// Resolve value argument (type is validated at mapEnd when outputType is known)
		let valueValue = 0;
		let valueIsInteger = false;
		let valueIsFloat64 = false;

		if (valueArg.type === ArgumentType.LITERAL) {
			valueValue = valueArg.value;
			valueIsInteger = valueArg.isInteger;
			valueIsFloat64 = !!valueArg.isFloat64;
		} else {
			valueValue = valueArg.value.charCodeAt(0);
			valueIsInteger = true;
		}

		mapState.rows.push({
			keyValue,
			valueValue,
			valueIsInteger,
			valueIsFloat64,
		});

		return context;
	}
);

export default map;
