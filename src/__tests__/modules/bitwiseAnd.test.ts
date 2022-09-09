import moduleTypeGenerator from '../../modules/bitwiseAnd';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
