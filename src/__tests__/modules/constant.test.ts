import moduleTypeGenerator from '../../modules/constant';
it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
