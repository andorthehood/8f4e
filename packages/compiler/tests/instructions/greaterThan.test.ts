import { moduleTester } from './testUtils';

moduleTester(
	'greaterThan (int)',
	`module greaterThan

int input1
int input2
int output

push &output
push input1
push input2
greaterThan
store

moduleEnd
`,
	[[{ input1: 420, input2: 420 }, { output: 0 }]],
	[[{ input1: 420, input2: 0 }, { output: 1 }]],
	[[{ input1: 0, input2: 0 }, { output: 0 }]],
	[[{ input1: 0, input2: 69 }, { output: 0 }]],
	[[{ input1: 0, input2: -69 }, { output: 1 }]]
);

moduleTester(
	'greaterThan (float)',
	`module greaterThan

float input1
float input2
int output

push &output
push input1
push input2
greaterThan
store

moduleEnd
`,
	[[{ input1: 420.1, input2: 420.1 }, { output: 0 }]],
	[[{ input1: 420.1, input2: 0.001 }, { output: 1 }]],
	[[{ input1: 0.001, input2: 0.001 }, { output: 0 }]],
	[[{ input1: 0.001, input2: 69.1 }, { output: 0 }]],
	[[{ input1: 0.001, input2: -69.1 }, { output: 1 }]]
);
