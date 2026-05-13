import type { CodeError } from '@8f4e/editor-state-types';

export interface SerialPortLike {
	readable?: ReadableStream<Uint8Array> | null;
	open: (options: { baudRate: number }) => Promise<void>;
	close?: () => Promise<void>;
	getInfo?: () => {
		usbVendorId?: number;
		usbProductId?: number;
	};
}

export interface SerialNavigatorLike {
	getPorts: () => Promise<SerialPortLike[]>;
	addEventListener?: (type: 'connect' | 'disconnect', listener: (event: Event) => void) => void;
	removeEventListener?: (type: 'connect' | 'disconnect', listener: (event: Event) => void) => void;
}

export interface SerialInPipeline {
	port: string;
	baudRate: number;
	bufferMemoryId: string;
	frameBytes: number;
	lineNumber: number;
	codeBlockId: string | number;
	codeBlockType?: CodeError['codeBlockType'];
	moduleId?: string;
}

export interface SerialInCallbackBinding {
	port: string;
	exportName: string;
	lineNumber: number;
	codeBlockId: string | number;
	codeBlockType?: CodeError['codeBlockType'];
}

export type SerialPortLookup = (port: string) => SerialPortLike | undefined;
