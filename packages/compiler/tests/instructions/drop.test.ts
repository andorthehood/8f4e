import { moduleTester } from './testUtils';

moduleTester(
	'drop',
	`module drop

push 1
drop

moduleEnd
`
);
