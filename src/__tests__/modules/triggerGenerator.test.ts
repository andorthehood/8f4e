import moduleTypeGenerator from '../../modules/triggerGenerator';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
