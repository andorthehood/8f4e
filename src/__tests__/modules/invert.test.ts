import moduleTypeGenerator from '../../modules/invert';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
