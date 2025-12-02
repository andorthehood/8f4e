import { parseCode } from '../../../../helpers/codeParsers/multiLineCodeParser';

export function parsePressedKeys(code: string[], pressedKeysListMemoryId: string, startingNumber: number) {
	const pressedKeys = new Set<number>();

	const pattern = [`init ${pressedKeysListMemoryId}[:index] :key`];

	parseCode(code, pattern).forEach(({ key }) => {
		pressedKeys.add(parseInt(key, 10) - startingNumber);
	});

	return pressedKeys;
}
