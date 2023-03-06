export interface MidiModuleAddresses {
	moduleId: string;
	noteAddress: number | undefined;
	channelAddress: number | undefined;
	noteOnOffAddress: number | undefined;
	velocityAddress: number | undefined;
}

export interface MidiCCModuleAddresses {
	moduleId: string;
	valueAddress: number | undefined;
	channelAddress: number | undefined;
	selectedCCAddress: number | undefined;
}

export interface RNBOModule {
	patcherId: string;
	paramAdresses: number[];
}
