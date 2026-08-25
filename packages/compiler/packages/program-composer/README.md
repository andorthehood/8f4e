# @8f4e/program-composer

Private compiler stage that parses recursive `ProjectObjectModel` trees, isolates group symbols, and produces one
ordered AST program for global allocation and code generation.

Group names form canonical encoded paths. The root project keeps unqualified symbols, while nested symbols use readable
identities such as `audio/counter` and `audio/voices/counter`; these identities flow unchanged into compiler result maps.
Module-name segments use the language-spec character set `[A-Za-z_][A-Za-z0-9_-]*` and remain unencoded.

This package is internal to `@8f4e/compiler` and is not a second project object model or a public compilation API.
