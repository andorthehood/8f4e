/**
 * List of supported config types.
 */
export const SUPPORTED_CONFIG_TYPES = ['project', 'editor'] as const;
export type ConfigType = (typeof SUPPORTED_CONFIG_TYPES)[number];
