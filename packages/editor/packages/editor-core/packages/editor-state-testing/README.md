# Editor State Testing Package

This package provides framework-agnostic test helpers for packages that consume editor-state data structures.

It intentionally does not depend on `@8f4e/editor-state`, so tests in downstream packages can create state-shaped mocks without creating a release dependency on the editor-state implementation package.
