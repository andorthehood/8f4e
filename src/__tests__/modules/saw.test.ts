import moduleTypeGenerator from '../../modules/saw';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
