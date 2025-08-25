# Technical Debt & Future Improvements

This directory contains documentation for planned improvements and technical debt. Each TODO item has its own file for better tracking and focused discussions.

## File Naming Convention

- **Format**: `NNN-short-description.md` (3-digit number + kebab-case description)
- **Numbers**: Sequential, starting from 001
- **Descriptions**: Brief, descriptive, using kebab-case

## Priority Levels

- 🔴 **High** - Should be addressed before major releases
- 🟡 **Medium** - Should be addressed in next development cycle
- 🟢 **Low** - Nice to have, address when convenient

## Adding New TODOs

1. **Choose next sequential number** (check existing files)
2. **Use the template**: Copy `_template.md` to `NNN-description.md`
3. **Fill in details**: Complete all sections in the template
4. **Update this README**: Add entry to the appropriate priority section
5. **Assign priority**: Use 🔴🟡🟢 indicators

## Completing TODOs

1. **Mark as completed**: Update status to "Completed" in the TODO file
2. **Move to archived folder**: Move the completed TODO file to `archived/` folder
3. **Update this README**: Remove from active lists and add to completed section
4. **Update related TODOs**: Check if completion affects other items and update dependencies

## Completed Items

### ✅ Recently Completed
- None yet

## Template

Use `_template.md` as the starting point for new TODO items. It includes all the standard sections and formatting.

## Archive Process

When a TODO is completed:
1. **Update the TODO file**: Change status from "Open" to "Completed"
2. **Add completion date**: Note when the task was finished
3. **Move to archived folder**: Move the file to `todo/archived/` for historical reference
4. **Update this README**: Remove from active priority sections and add to completed items
5. **Review dependencies**: Update any other TODOs that depended on this completed item

## Tracking

These items should be reviewed during:
- Pre-release planning
- Sprint planning  
- Architecture reviews
- Dependency update cycles 