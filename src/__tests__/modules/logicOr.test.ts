import moduleTypeGenerator from '../../modules/logicOr';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
