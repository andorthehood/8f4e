import type { ExampleModule } from '@8f4e/editor-state';

const mapToVariableRangeFloat: ExampleModule = {
	title: 'Map Signal to Variable Range (Float)',
	author: 'Andor Polgar',
	category: 'Utils',
	code: `module mapToRange

const IN_RANGE_MIN -1.0
const IN_RANGE_MAX 1.0
float min 0.0
float max 127.0

float* in
float* outRangeMin &min
float* outRangeMax &max
float out

push &out
push *in
push IN_RANGE_MIN
sub
push IN_RANGE_MAX
push IN_RANGE_MIN
sub
div
push *outRangeMax
push *outRangeMin
sub
mul
push *outRangeMin
add
store

moduleEnd`,
	tests: [],
};

export default mapToVariableRangeFloat;
