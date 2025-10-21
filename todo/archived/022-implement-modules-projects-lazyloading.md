---
title: 'TODO: Implement Lazy Loading for Modules and Projects'
priority: Medium
effort: 4-6 days
created: 2025-08-26
status: Completed
completed: 2025-09-04
---

# TODO: Implement Lazy Loading for Modules and Projects

## ✅ Implementation Summary

**Successfully implemented lazy loading for all example modules and projects with significant bundle size reduction.**

**Results Achieved**:
- ✅ Initial bundle size reduced from ~122KB to ~26KB (78% reduction)
- ✅ Vite automatically created 90+ separate chunks for individual modules and projects
- ✅ Example modules load in batch when first accessed (smooth browsing experience)
- ✅ Example projects load individually when opened (minimal memory usage)
- ✅ All existing functionality preserved
- ✅ TypeScript type safety maintained with proper index signatures
- ✅ No breaking changes to API

**Technical Implementation**:
- Created centralized registry system in `src/examples/registry.ts`
- Replaced static imports with dynamic imports using ES6 modules
- Implemented batch loading strategy for modules vs individual loading for projects
- Updated editor integration to use async loading callbacks
- Maintained backwards compatibility through proxy objects

**Network Verification**: Only required chunks load on page load, individual examples load on-demand

## Problem Description

Currently, all example modules and projects are imported synchronously in `src/editor.ts`, which means they are loaded upfront even when users don't need them. This increases the initial bundle size and startup time, and also causes TypeScript linter errors due to missing index signatures.

**Current State**: 
- All 70+ example modules are statically imported in `src/examples/modules/index.ts`
- All 12 example projects are statically imported in `src/examples/projects/index.ts`
- These are then imported synchronously in `src/editor.ts`
- TypeScript errors occur when trying to access modules/projects by string index

**Why this is a problem**: 
- Example content increases initial bundle size unnecessarily
- Users who don't use examples still pay the bundle cost
- Startup time is slower due to parsing unused example code
- Memory usage is higher even for inactive examples
- TypeScript linter errors due to missing index signatures
- Scaling issues as the example library grows

**Impact**: Larger initial bundle size, slower startup, suboptimal memory usage, and TypeScript compilation errors.

## Proposed Solution

**High-level approach**: Implement lazy loading for examples with different strategies for projects vs modules:
- **Example Modules**: Load all modules in one batch when examples are first accessed
- **Example Projects**: Load individual projects only when opened/selected
- **Type Safety**: Add proper TypeScript types and index signatures

**Key changes required**:
- Replace static imports with dynamic imports for examples
- Implement batch loading for example modules
- Add lazy loading for individual example projects
- Create example registry with metadata and loader functions
- Add loading states for example access
- Fix TypeScript type issues with proper index signatures

**Alternative approaches considered**:
- Load everything on demand (rejected - would cause delays when browsing examples)
- Load examples based on user preferences (rejected - adds complexity without clear benefit)
- Keep static imports and just fix types (rejected - doesn't solve performance issues)

## Implementation Plan

### ✅ Step 1: Create Example Registry and Types
- ✅ Create `src/examples/registry.ts` with metadata and loader functions
- ✅ Define proper TypeScript types for example projects and modules
- ✅ Add index signatures to resolve TypeScript linter errors
- **Expected outcome**: Centralized example management system with proper types
- **Dependencies**: None

### ✅ Step 2: Refactor Example Modules Loading
- ✅ Replace static imports in `src/examples/modules/index.ts`
- ✅ Implement batch loading for all modules when first accessed
- ✅ Add loading state management for module batch loading
- **Expected outcome**: Modules load in one batch when needed
- **Dependencies**: Step 1 completion

### ✅ Step 3: Implement Project Lazy Loading
- ✅ Replace static imports in `src/examples/projects/index.ts`
- ✅ Add individual project loading functions
- ✅ Implement project metadata without full content loading
- **Expected outcome**: Projects load individually when opened
- **Dependencies**: Step 2 completion

### ✅ Step 4: Update Editor Integration
- ✅ Modify `src/editor.ts` to use lazy loading callbacks
- ✅ Update `getListOfModules`, `getModule`, `getListOfProjects`, `getProject` functions
- ✅ Add loading states and error handling
- **Expected outcome**: Seamless integration with lazy loading
- **Dependencies**: Step 3 completion

## Success Criteria

- ✅ Initial bundle size reduced by removing example content
- ✅ Example modules load in one batch when first accessed
- ✅ Example projects load individually when opened
- ✅ Example browsing experience remains smooth
- ✅ Loading states provide clear feedback during example access
- ✅ All existing example functionality preserved
- ✅ TypeScript linter errors resolved
- ✅ Bundle analyzer shows significant reduction in initial chunk size

## Affected Components

- ✅ `src/examples/modules/index.ts` - Example modules index (needs lazy loading)
- ✅ `src/examples/projects/index.ts` - Example projects index (needs lazy loading)
- ✅ `src/examples/registry.ts` - New example registry (to be created)
- ✅ `src/editor.ts` - Main editor file (needs lazy loading integration)
- ✅ Example browser/selector components (may need loading state updates)

## Archive Instructions

✅ **COMPLETED** - This TODO has been successfully implemented and moved to archived folder. 