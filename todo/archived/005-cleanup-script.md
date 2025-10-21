---
title: 'TODO: Create shell script to remove untracked node_modules and dist folders'
priority: �
effort: 1 hour
created: 2025-08-25
status: Open
completed: null
---

# TODO: Create shell script to remove untracked node_modules and dist folders

## Problem Description

Need a simple way to clean up untracked `node_modules` and `dist` folders from packages in the workspace.
- What is the current state? Manual deletion of build artifacts when needed
- Why is this a problem? Time-consuming and easy to miss folders
- What impact does it have? Stale builds and wasted disk space

## Proposed Solution

Create a simple `.sh` script that:
- Finds and removes `node_modules` folders in packages directory
- Finds and removes `dist` folders in packages directory
- Only removes untracked folders to avoid breaking active development

## Implementation Plan

### Step 1: Create cleanup.sh script
- Write shell script using `find` command to locate folders
- Use `rm -rf` to remove found folders
- Add safety checks to only remove in packages directory

### Step 2: Make script executable
- Set proper permissions with `chmod +x cleanup.sh`
- Test script functionality
- Add to root directory for easy access

## Success Criteria

- [ ] Script removes all `node_modules` folders from packages/*
- [ ] Script removes all `dist` folders from packages/*
- [ ] Script only operates on untracked folders
- [ ] Script is executable and works from project root

## Affected Components

- `cleanup.sh` - New shell script in project root
- `packages/*/node_modules/` - Folders to be removed
- `packages/*/dist/` - Folders to be removed

## Risks & Considerations

- **Risk 1**: Removing tracked folders - Check git status before removal
- **Dependencies**: None
- **Breaking Changes**: None

## Related Items

- **Blocks**: None
- **Depends on**: None
- **Related**: None

## References

- [Find command documentation](https://man7.org/linux/man-pages/man1/find.1.html)

## Notes

- Keep it simple - just a basic shell script
- Focus on packages directory only
- Consider adding dry-run option for safety