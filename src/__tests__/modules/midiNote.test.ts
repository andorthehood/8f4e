import moduleTypeGenerator from '../../modules/midiNote';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
