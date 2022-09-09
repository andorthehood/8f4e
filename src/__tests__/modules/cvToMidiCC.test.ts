import moduleTypeGenerator from '../../modules/cvToMidiCC';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator()).toMatchSnapshot();
});
