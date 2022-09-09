import moduleTypeGenerator from '../../modules/adc8bit';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
