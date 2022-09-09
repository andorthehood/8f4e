import moduleTypeGenerator from '../../modules/triangle';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
