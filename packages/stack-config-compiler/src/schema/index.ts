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
export { preprocessSchema } from './preprocessSchema';
export { lookupSchemaNode } from './lookupSchemaNode';
export { validateNavigationSegment } from './validateNavigationSegment';
export { validateNavigation } from './validateNavigation';
export { validateAndPushSegments } from './validateAndPushSegments';
export { validateValue } from './validateValue';
export { collectRequiredPaths } from './collectRequiredPaths';
export { findMissingRequiredFields } from './findMissingRequiredFields';
