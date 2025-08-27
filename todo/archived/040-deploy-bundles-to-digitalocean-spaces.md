# TODO: Deploy Editor Bundle to DigitalOcean Spaces

**Priority**: 🟡
**Estimated Effort**: 4-6 hours
**Created**: 2025-08-27
**Status**: Completed
**Completed**: 2025-08-27

## Problem Description

Currently, the 8f4e editor package is built using TypeScript compilation (`tsc`) which creates multiple files in `dist/` directories. This makes it difficult to use the editor on external websites via script tags, as users would need to:
- Load multiple JavaScript files
- Handle module resolution and dependencies
- Deal with import/export compatibility issues

The goal is to create a single-file bundle (UMD format) that can be loaded directly via script tags on any external website, enabling easy integration of the 8f4e editor.

## Proposed Solution

Create an optimized single-file bundle using Vite for the editor package:
- **@8f4e/editor** - Main editor interface with all dependencies bundled

This bundle will be:
- UMD format for universal compatibility
- Self-contained with all dependencies
- Optimized and minified
- Deployed to DigitalOcean Spaces (S3-compatible) for global CDN access
- Automatically deployed via GitHub Actions

## Implementation Plan

### Step 1: Configure Vite for Editor Package
- Create `vite.config.ts` for the editor package
- Configure UMD library builds with proper entry points
- Set up dependency bundling and tree-shaking
- Ensure ES2020 target compatibility
- **Expected outcome**: Editor package can build a single UMD bundle
- **Dependencies**: Vite must be available in the editor package

### Step 2: Update Editor Package Configuration
- Add `bundle` scripts to the editor package's `package.json`
- Update `project.json` file to include bundle target
- Configure Nx to recognize bundle target
- Add bundle command to root `package.json`
- **Expected outcome**: `npm run bundle:editor` works and creates optimized bundle
- **Dependencies**: Step 1 completion

### Step 3: Test Bundle Generation Locally
- Run bundle command for the editor package
- Verify UMD output file is generated correctly
- Test bundle loading in a simple HTML page
- Validate that all editor functionality works as expected
- **Expected outcome**: Bundle loads and functions correctly in browser
- **Dependencies**: Steps 1-2 completion

### Step 4: Set Up DigitalOcean Spaces
- Create a new Space in DigitalOcean
- Configure as public for script tag access
- Generate API keys (access key + secret key)
- Set up CORS rules if needed
- **Expected outcome**: Space is ready to receive bundle uploads
- **Dependencies**: DigitalOcean account access

### Step 5: Create GitHub Actions Workflow
- Create `.github/workflows/deploy-editor-bundle.yml`
- Configure DigitalOcean Spaces authentication
- Set up bundle building and deployment pipeline
- Add environment variables and secrets
- **Expected outcome**: Automated deployment on push to main branch
- **Dependencies**: Steps 1-4 completion

### Step 6: Test Deployment Pipeline
- Push changes to trigger deployment
- Verify bundle is uploaded to DigitalOcean Spaces
- Test bundle loading from deployed URL
- Validate CDN delivery and performance
- **Expected outcome**: Bundle is accessible via public URL
- **Dependencies**: Step 5 completion

### Step 7: Create Usage Documentation
- Document bundle URL and loading instructions
- Provide integration examples for external websites
- Create troubleshooting guide
- Update README with deployment information
- **Expected outcome**: Clear instructions for external developers
- **Dependencies**: Step 6 completion

## Success Criteria

- [ ] Editor package generates valid UMD bundle
- [ ] Bundle is automatically deployed to DigitalOcean Spaces
- [ ] Bundle loads correctly via script tags on external websites
- [ ] Editor functionality works as expected from bundled code
- [ ] Deployment pipeline runs successfully on every push
- [ ] Bundle URL is publicly accessible and performant

## Affected Components

- `packages/editor/` - Add Vite config, bundle target, and scripts
- `packages/editor/package.json` - Add bundle scripts
- `packages/editor/project.json` - Add bundle target to Nx configuration
- `package.json` - Add root-level bundle command
- `.github/workflows/` - New deployment workflow file
- `docs/` - Update with deployment and usage instructions

## Risks & Considerations

- **Bundle Size**: Large bundle may impact initial page load times
  - *Mitigation*: Implement code splitting if bundle exceeds 1MB
- **Dependency Conflicts**: External websites may have conflicting dependencies
  - *Mitigation*: Use UMD format and scope all dependencies internally
- **Breaking Changes**: Bundle updates may break external integrations
  - *Mitigation*: Implement versioning strategy and backward compatibility
- **CORS Issues**: Some browsers may block cross-origin script loading
  - *Mitigation*: Configure proper CORS headers in DigitalOcean Spaces
- **Dependencies**: Requires Vite to be available in the editor package
- **Breaking Changes**: None - this is additive functionality

## Related Items

- **Blocks**: None
- **Depends on**: None
- **Related**: 
  - `todo/031-lazy-load-runtime-factories.md` - Similar runtime loading strategy
  - `todo/017-lazyload-examples.md` - Related to external loading patterns

## References

- [Vite Library Mode Documentation](https://vitejs.dev/guide/build.html#library-mode)
- [DigitalOcean Spaces S3 Compatibility](https://docs.digitalocean.com/products/spaces/references/s3-compatibility/)
- [UMD Module Format](https://github.com/umdjs/umd)
- [GitHub Actions AWS Credentials](https://github.com/aws-actions/configure-aws-credentials)

## Notes

### Bundle Strategy Details
- **Editor Package**: Bundles all internal dependencies and UI components
- **UMD Format**: Ensures compatibility with AMD, CommonJS, and global variables

### DigitalOcean Spaces Benefits
- S3-compatible API for easy integration
- Built-in CDN for global performance
- Cost-effective compared to AWS S3
- Simple pricing structure

### Deployment Strategy
- Automatic deployment on push to main branch
- Manual deployment option for specific packages
- Version control through bundle file names

### Performance Considerations
- Bundle will be minified and optimized
- Tree-shaking removes unused code
- CDN delivery ensures fast global access
- Bundle size monitoring recommended

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. Ensure all success criteria are met and deployment is working correctly before archiving. 