import moduleTypeGenerator from '../../modules/clockGenerator';
it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
