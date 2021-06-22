import moduleTypeGenerator from '../../modules/bitwiseAnd';

it('generates correct module type descriptor', () => {
	expect(moduleTypeGenerator({ vGrid: 6, hGrid: 14 })).toMatchSnapshot();
});
