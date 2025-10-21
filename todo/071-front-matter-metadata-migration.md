---
title: 'TODO: Front Matter Metadata Migration'
priority: 🟡
effort: 0.5-1d
created: 2025-10-21
status: Open
completed: null
---

# TODO: Front Matter Metadata Migration

## Problem Description

Active TODO documents still store key metadata (priority, estimated effort, creation date, status, completion date) within the body as bold text. This format makes the data harder to parse automatically, increases the chance of inconsistencies, and requires manual duplication when generating indexes or reporting. Without structured front matter, tooling cannot reliably surface or manipulate TODO metadata.

## Proposed Solution

Move the existing metadata into YAML front matter for every TODO document. Ensure the front matter schema matches the updated template so future TODOs consistently use it. Update any scripts that read TODO metadata (including the index generator) to consume the front matter fields while keeping backward compatibility if necessary.

## Implementation Plan

### Step 1: Define and Document Schema
- Confirm the canonical front matter keys (`priority`, `effort`, `created`, `status`, `completed`) and acceptable values.
- Document formatting expectations (emoji values, `null` for incomplete dates, capitalization) in the README or contributor docs.
- Expected outcome: Shared understanding of the metadata schema before migration.
- Dependencies or prerequisites: Updated template.

### Step 2: Migrate Existing TODO Files
- Write a script or perform controlled edits to move the metadata blocks into front matter for every TODO (active, archived, brainstorming notes if applicable).
- Preserve original values and ensure Markdown headings remain intact after removal of redundant bold lines.
- Expected outcome: All TODO markdown files use front matter for metadata.
- Dependencies or prerequisites: Step 1.

### Step 3: Update Supporting Tooling
- Adjust the TODO index generation (or other automation) to read the new front matter and regenerate `_index.md` accurately.
- Add validation or linting to catch missing or malformed metadata going forward.
- Expected outcome: Automation consumes front matter, and regressions are prevented.
- Dependencies or prerequisites: Step 2.

### Step 4: Clean Up Documentation
- Remove any obsolete instructions that mention inline metadata blocks.
- Ensure `_template.md` and contributor guidance reference the front matter workflow.
- Expected outcome: Documentation reflects the new front matter schema across the board.
- Dependencies or prerequisites: Steps 1-3.

## Success Criteria

- [ ] Every TODO markdown document stores metadata exclusively in front matter.
- [ ] Automated TODO index correctly reflects migrated metadata.
- [ ] Linting or scripts fail if required front matter fields are missing or invalid.

## Affected Components

- `todo/_index.md` - Regenerate entries based on front matter.
- `scripts/` or tooling responsible for TODO management - Update parsers and generators.
- TODO markdown files across `todo/`, `todo/archived/`, and `todo/brainstorming_notes/`.

## Risks & Considerations

- **Risk 1**: Manual migration errors could drop metadata; mitigate with scripted transformations and backups.
- **Risk 2**: Existing automation may break if not adjusted; mitigate with incremental rollout and tests.
- **Dependencies**: Access to scripts generating `_index.md` and any data pipeline using TODO metadata.
- **Breaking Changes**: Downstream consumers expecting inline metadata must be updated simultaneously.

## Related Items

- **Blocks**: None currently identified.
- **Depends on**: Completion of template update (already in place).
- **Related**: TODO `_template.md`, TODO index generator scripts.

## References

- [YAML Front Matter Best Practices](https://jekyllrb.com/docs/front-matter/)
- [Existing TODO Index Automation](_index.md)

## Notes

- Keep an eye out for archived TODOs where metadata may differ or use non-standard values.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
