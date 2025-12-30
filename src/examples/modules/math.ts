import type { ExampleModule } from '@8f4e/editor-state';

const math: ExampleModule = {
	title: 'Math Constants',
	author: 'Andor Polgar',
	category: 'Constants',
	code: `constants math

const PI      3.141592653589793
const PI_    -3.141592653589793
const TWO_PI  6.283185307179586
const HALF_PI 1.570796326794896
const E       2.718281828459045

constantsEnd`,
	tests: [],
};

export default math;
