import moduleTypeGenerator from '../../modules/clockGenerator';
it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator({ vGrid: 6, hGrid: 14 })).toMatchSnapshot();
});
