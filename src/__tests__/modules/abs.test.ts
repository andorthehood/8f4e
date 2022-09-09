import moduleTypeGenerator from '../../modules/abs';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
