import ccNames from '../../midi/ccNames';

test('test if the list matches the snapshot', () => {
	expect(ccNames).toMatchSnapshot();
});

test('if the last item is poly mode', () => {
	expect(ccNames[127]).toMatchObject({ name: 'poly mode' });
});
