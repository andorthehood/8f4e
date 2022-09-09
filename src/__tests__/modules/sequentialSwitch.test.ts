import moduleTypeGenerator from '../../modules/sequentialSwitch';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
