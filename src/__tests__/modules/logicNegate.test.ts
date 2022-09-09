import moduleTypeGenerator from '../../modules/logicNegate';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
