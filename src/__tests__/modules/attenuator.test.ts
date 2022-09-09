import moduleTypeGenerator from '../../modules/attenuator';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
