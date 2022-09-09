import moduleTypeGenerator from '../../modules/bitwiseOr';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
