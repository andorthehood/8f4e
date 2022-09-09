import moduleTypeGenerator from '../../modules/scope';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
