import * as moduleTypes from '../../../modules';
import { ModuleType } from '../../types';

const getModuleCategories = function (moduleTypes: { [key: string]: ModuleType }): string[] {
	return Object.values(moduleTypes)
		.reduce((accumulator, moduleType: ModuleType) => {
			if (accumulator.includes(moduleType.category)) {
				return accumulator;
			} else {
				return [...accumulator, moduleType.category];
			}
		}, [])
		.sort();
};

const filterModuleTypesByCategory = function (moduleTypes: { [key: string]: ModuleType }, category: string): string[] {
	return Object.keys(moduleTypes).filter((type: string) => {
		return moduleTypes[type].category === category;
	});
};

const contextMenu = function (state, events) {
	const onModuleMenu = event => {
		const { y } = event;

		state.ui.contextMenu.highlightedItem = 0;
		state.ui.contextMenu.y = y;
		state.ui.contextMenu.open = true;

		if (event.category) {
			const modules = filterModuleTypesByCategory(moduleTypes, event.category);
			state.ui.contextMenu.items = modules.map(type => {
				return {
					title: moduleTypes[type].name,
					action: 'addModule',
					payload: { type },
					close: true,
				};
			});
		} else {
			const categories = getModuleCategories(moduleTypes);
			state.ui.contextMenu.items = categories.map(category => {
				return {
					title: category,
					action: 'openModuleMenu',
					payload: { category },
					close: false,
				};
			});
		}
	};

	events.on('openModuleMenu', onModuleMenu);

	return () => {
		events.off('openModuleMenu', onModuleMenu);
	};
};

export default contextMenu;
