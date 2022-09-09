import moduleTypeGenerator from '../../modules/sampleAndHold';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
