import { ModuleType, ModuleTypeLookup, State } from '../../types';

function getModuleCategories(moduleTypes: ModuleTypeLookup): string[] {
	return Object.values(moduleTypes)
		.reduce((accumulator, moduleType: ModuleType) => {
			if (accumulator.includes(moduleType.category)) {
				return accumulator;
			} else {
				return [...accumulator, moduleType.category];
			}
		}, [])
		.sort();
}

function filterModuleTypesByCategory(moduleTypes: ModuleTypeLookup, category: string): string[] {
	return Object.keys(moduleTypes).filter((type: string) => {
		return moduleTypes[type].category === category;
	});
}

export default function contextMenu(state: State, events) {
	const onModuleMenu = event => {
		const { y } = event;

		state.contextMenu.highlightedItem = 0;
		state.contextMenu.y = y;
		state.contextMenu.open = true;

		if (event.category) {
			const modules = filterModuleTypesByCategory(state.moduleTypes, event.category);
			state.contextMenu.items = [
				{
					title: 'Back',
					action: 'openModuleMenu',
					payload: {},
					close: false,
				},
				...modules.map(type => {
					return {
						title: state.moduleTypes[type].name,
						action: 'addModule',
						payload: { type },
						close: true,
					};
				}),
			];
		} else {
			const categories = getModuleCategories(state.moduleTypes);
			state.contextMenu.items = [
				{
					title: 'Back',
					action: 'contextmenu',
					payload: {},
					close: false,
				},
				...categories.map(category => {
					return {
						title: category,
						action: 'openModuleMenu',
						payload: { category },
						close: false,
					};
				}),
			];
		}
	};

	events.on('openModuleMenu', onModuleMenu);

	return () => {
		events.off('openModuleMenu', onModuleMenu);
	};
}
