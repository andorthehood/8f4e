/** Compiler directives that are valid in module bodies. */
export const moduleCompilerDirectives = ['#skipExecution', '#loopCap', '#region'] as const;

/** Compiler directives that are valid in function bodies. */
export const functionCompilerDirectives = ['#impure', '#export', '#import', '#loopCap'] as const;
