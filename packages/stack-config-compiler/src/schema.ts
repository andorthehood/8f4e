/**
 * Schema module - re-exports from schema/ directory
 *
 * This file provides backward compatibility for imports from './schema'.
 * The actual implementations are in the schema/ directory.
 */

export type {
	JSONSchemaLike,
	JSONSchemaType,
	MissingFieldError,
	SchemaNode,
	SchemaOptions,
	SchemaValidationError,
	SegmentValidationError,
} from './schema/index';

export {
	collectRequiredPaths,
	createSchemaNode,
	findMissingRequiredFields,
	lookupSchemaNode,
	preprocessSchema,
	validateAndPushSegments,
	validateNavigation,
	validateNavigationSegment,
	validateValue,
} from './schema/index';
