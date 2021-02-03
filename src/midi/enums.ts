export const enum Event {
	/** This message is sent when a note is released (ended). */
	NOTE_OFF = 0x80,
	/** This message is sent when a note is depressed (start). */
	NOTE_ON = 0x90,
	/** This message is sent when a note is depressed (start). */
	POLYPHONIC_AFTERTOUCH = 0xa0,
	/** This message is sent when a controller value changes. Controllers include
	 * devices such as pedals and levers. Controller numbers 120-127 are
	 * reserved as "Channel Mode Messages". */
	CONTROL_CHANGE = 0xb0,
	/** This message sent when the patch number changes. */
	PROGRAM_CHANGE = 0xc0,
	/** This message is most often sent by pressing down on the key after it
	 * "bottoms out". This message is different from polyphonic after-touch. Use
	 * this message to send the single greatest pressure value (of all the
	 * current depressed keys). */
	CHANNEL_AFTERTOUCH = 0xd0,
	/** This message is sent to indicate a change in the pitch bender (wheel or
	 * lever; typically). The pitch bender is measured by a fourteen bit value.
	 * Center (no pitch change) is 2000H. */
	PITCH_WHEEL = 0xe0,
}
