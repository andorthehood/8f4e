import moduleTypeGenerator from '../../modules/splitter';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
