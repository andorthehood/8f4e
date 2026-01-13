/**
 * Schema module exports
 *
 * Provides JSON Schema validation utilities for stack-config programs.
 */

export type {
	JSONSchemaLike,
	JSONSchemaType,
	MissingFieldError,
	SchemaNode,
	SchemaOptions,
	SchemaValidationError,
	SegmentValidationError,
} from './types';

export { createSchemaNode } from './types';
export { default as preprocessSchema } from './preprocessSchema';
export { default as lookupSchemaNode } from './lookupSchemaNode';
export { default as validateNavigationSegment } from './validateNavigationSegment';
export { default as validateNavigation } from './validateNavigation';
export { default as validateAndPushSegments } from './validateAndPushSegments';
export { default as validateValue } from './validateValue';
export { default as collectRequiredPaths } from './collectRequiredPaths';
export { default as findMissingRequiredFields } from './findMissingRequiredFields';
export { default as validateCombinators } from './validateCombinators';
