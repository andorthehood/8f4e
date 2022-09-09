import moduleTypeGenerator from '../../modules/adc16bit';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
