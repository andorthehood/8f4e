import moduleTypeGenerator from '../../modules/mixer';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
