---
title: 'TODO: [Brief Title]'
priority: High/Medium/Low
effort: X hours/days
created: YYYY-MM-DD
status: Open/Completed
completed: null
---

# TODO: [Brief Title]

## Problem Description

Clear description of the issue, technical debt, or improvement needed. Include:
- What is the current state?
- Why is this a problem?
- What impact does it have?

## Proposed Solution

Detailed description of the proposed solution:
- High-level approach
- Key changes required
- Alternative approaches considered

## Anti-Patterns (Optional)

- What not to do (common misinterpretations to avoid)
- Things that look similar but are incorrect

## Implementation Plan

### Step 1: [Action]
- Specific task description
- Expected outcome
- Dependencies or prerequisites

### Step 2: [Action]
- Specific task description
- Expected outcome
- Dependencies or prerequisites

### Step 3: [Action]
- Specific task description
- Expected outcome
- Dependencies or prerequisites

## Validation Checkpoints (Optional)

- Commands or checks to confirm each step completed correctly
- Example: `rg -n "pattern" path/` or `git status` expectations

## Success Criteria

- [ ] Specific, measurable outcome
- [ ] Another measurable outcome  
- [ ] Verification method (tests, manual testing, etc.)

## Affected Components

- `package/component1` - How it's affected
- `package/component2` - How it's affected
- `file/path.ts` - Specific files that need changes

## Risks & Considerations

- **Risk 1**: Description and mitigation strategy
- **Risk 2**: Description and mitigation strategy
- **Dependencies**: What needs to happen first
- **Breaking Changes**: Any potential breaking changes

## Related Items

- **Blocks**: Links to TODOs that depend on this
- **Depends on**: Links to TODOs this depends on
- **Related**: Links to related TODOs or issues

## References

- [Relevant documentation](https://example.com)
- [GitHub issues/PRs](https://github.com/link)
- [External resources](https://example.com)

## Notes

- Implementation notes
- Historical context
- Decisions made and why
- Update log (when status changes)

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
