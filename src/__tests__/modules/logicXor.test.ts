import moduleTypeGenerator from '../../modules/logicXor';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
