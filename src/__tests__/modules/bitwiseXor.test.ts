import moduleTypeGenerator from '../../modules/bitwiseXor';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
