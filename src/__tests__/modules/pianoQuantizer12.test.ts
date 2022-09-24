import moduleTypeGenerator from '../../modules/pianoQuantizer12';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
