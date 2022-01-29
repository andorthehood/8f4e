import { SpriteCoordinates } from '2d-engine';
import { lookup } from './pianoKeyboard';

const fixtures: [key: number, spriteCoordinates: SpriteCoordinates][] = [
	[1, { spriteHeight: 76, spriteWidth: 16, x: 208, y: 200 }],
	[2, { spriteHeight: 76, spriteWidth: 16, x: 224, y: 200 }],
	[3, { spriteHeight: 76, spriteWidth: 16, x: 240, y: 200 }],
];

describe('pianoKeyboard2', () => {
	test.each(fixtures)('key: %s should be: %s', (key, spriteCoordinates) => {
		expect(lookup(true)(key)).toStrictEqual(spriteCoordinates);
	});

	test('', async () => {
		await page.goto('http://localhost:3001');
		const image = await page.screenshot({ fullPage: true });
		expect(image).toMatchImageSnapshot();
	});
});
