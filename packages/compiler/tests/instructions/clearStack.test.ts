import { moduleTester } from './testUtils';

moduleTester(
	'clearStack',
	`module clearStack

push 1
push 1
clearStack

moduleEnd
`
);
