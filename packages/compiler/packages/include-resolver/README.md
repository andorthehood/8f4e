# @8f4e/include-resolver

`@8f4e/include-resolver` owns the include-only source resolution pass.

It parses only the `includes` block grammar from raw source text, resolves direct include ids through a caller-provided
callback, and returns a raw source tree. It does not depend on `@8f4e/project-preparser` and does not parse modules,
functions, constants, entries, groups, or compiler instructions.
