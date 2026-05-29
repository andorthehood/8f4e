export const moduleCompilerDirectives = [
	'#skipExecution',
	'#initOnly',
	'#test',
	'#mock',
	'#loopCap',
	'#region',
] as const;
export const functionCompilerDirectives = ['#impure', '#export', '#mock', '#loopCap'] as const;
