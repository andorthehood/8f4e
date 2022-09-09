import moduleTypeGenerator from '../../modules/logicAnd';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
