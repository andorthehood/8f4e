import moduleTypeGenerator from '../../modules/logicXor';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator({ vGrid: 6, hGrid: 14 })).toMatchSnapshot();
});
