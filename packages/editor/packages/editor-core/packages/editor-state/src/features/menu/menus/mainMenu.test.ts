import { describe, expect, it } from 'vitest';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { mainMenu } from './mainMenu';

describe('main menu', () => {
	it('shows project-opening actions by default', async () => {
		const items = await mainMenu(createMockState());

		expect(items.some(item => item.action === 'importProject')).toBe(true);
		expect(items.some(item => item.payload?.menu === 'projectMenu')).toBe(true);
	});

	it('hides project-opening actions when project opening is disabled', async () => {
		const state = createMockState({
			featureFlags: {
				projectOpening: false,
			},
		});

		const items = await mainMenu(state);

		expect(items.some(item => item.action === 'importProject')).toBe(false);
		expect(items.some(item => item.payload?.menu === 'projectMenu')).toBe(false);
		expect(items.some(item => item.action === 'new')).toBe(true);
		expect(items.some(item => item.action === 'exportProject')).toBe(true);
	});
});
