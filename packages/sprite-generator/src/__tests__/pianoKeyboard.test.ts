import { whiteKeyLeft, whiteKeyMiddle, whiteKeyRight, blackKey } from '../pianoKeyboard';

it('generates the correct drawing commands for piano keys', () => {
	expect(whiteKeyLeft(10, 20, 5, 5, '#ffffff', '#ffffff')).toMatchSnapshot();
	expect(whiteKeyMiddle(10, 20, 5, 5, '#ffffff', '#ffffff')).toMatchSnapshot();
	expect(whiteKeyRight(10, 20, 5, 5, '#ffffff', '#ffffff')).toMatchSnapshot();
	expect(blackKey(10, 20, '#ffffff', '#ffffff')).toMatchSnapshot();
});
