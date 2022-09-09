import moduleTypeGenerator from '../../modules/pianoQuantizer120';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
