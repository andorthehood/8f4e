import moduleTypeGenerator from '../../modules/square';
it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
