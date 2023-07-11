export interface MidiModuleAddresses {
	moduleId: string;
	noteWordAddress: number | undefined;
	channelWordAddress: number | undefined;
	noteOnOffWordAddress: number | undefined;
	velocityWordAddress: number | undefined;
}

export interface MidiCCModuleAddresses {
	moduleId: string;
	valueWordAddress: number | undefined;
	channelWordAddress: number | undefined;
	selectedCCWordAddress: number | undefined;
}

export interface RNBOModule {
	patcherId: string;
	paramAdresses: number[];
}
