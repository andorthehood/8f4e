import moduleTypeGenerator from '../../modules/randomGenerator';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
