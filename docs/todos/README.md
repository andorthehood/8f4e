# Technical Debt & Future Improvements

This directory contains documentation for planned improvements and technical debt. Each TODO item has its own file for better tracking and focused discussions.

## File Naming Convention

- **Format**: `NNN-short-description.md` (3-digit number + kebab-case description)
- **Numbers**: Sequential, starting from 001
- **Descriptions**: Brief, descriptive, using kebab-case

## Priority Levels

- **High** (🔴) - Should be addressed before major releases
- **Medium** (🟡) - Should be addressed in next development cycle
- **Low** (🟢) - Nice to have, address when convenient

## Adding New TODOs

1. **Choose next sequential number** (check existing files)
2. **Use the template**: Copy `_template.md` to `NNN-description.md`
3. **Fill in details**: Complete all sections in the template
5. **Assign priority**: Use High/Medium/Low values in front matter

## Completing TODOs

1. **Mark as completed**: Update status to "Completed" in the TODO file
2. **Move to archived folder**: Move the completed TODO file to `archived/` folder
4. **Update related TODOs**: Check if completion affects other items and update dependencies

## Template

Use `_template.md` as the starting point for new TODO items. It includes all the standard sections and formatting.