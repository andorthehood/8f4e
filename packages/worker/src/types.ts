export interface MidiModuleAddresses {
	noteAddress: number;
	channelAddress: number;
	noteOnOffAddress: number;
	velocityAddress: number;
}

export interface MidiCCModuleAddresses {
	valueAddress: number;
	channelAddress: number;
	selectedCCAddress: number;
}
