export interface MidiModuleAddresses {
	moduleId: string;
	noteAddress: number;
	channelAddress: number;
	noteOnOffAddress: number;
	velocityAddress: number;
}

export interface MidiCCModuleAddresses {
	moduleId: string;
	valueAddress: number;
	channelAddress: number;
	selectedCCAddress: number;
}
