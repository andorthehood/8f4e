# 8f4e Editor Bundle Deployment

This document describes how the 8f4e editor is bundled and deployed to DigitalOcean Spaces for external use.

## Overview

The 8f4e editor package is built as a UMD (Universal Module Definition) bundle that can be loaded directly via script tags on any external website. This enables easy integration of the 8f4e editor without requiring complex module bundling or dependency management.

## Bundle Details

- **Format**: UMD (Universal Module Definition)
- **Size**: ~84KB (gzipped: ~22KB)
- **Target**: ES2020
- **Dependencies**: All bundled internally
- **Global Variable**: `Editor8f4e`

## Deployment

The bundle is automatically deployed to DigitalOcean Spaces on every push to the `main` branch via GitHub Actions.

### Deployment URLs

```
Latest Bundle:    https://[bucket].[region].digitaloceanspaces.com/editor/editor-bundle.js
Versioned Bundle: https://[bucket].[region].digitaloceanspaces.com/editor/editor-bundle-[commit-sha].js
Deployment Info:  https://[bucket].[region].digitaloceanspaces.com/editor/deployment-info.json
```

### GitHub Actions Workflow

The deployment is handled by `.github/workflows/deploy-editor-bundle.yml` which:

1. Builds all packages
2. Generates the UMD bundle
3. Uploads to DigitalOcean Spaces with proper caching headers
4. Creates both latest and versioned copies
5. Provides deployment summary

### Required Secrets and Variables

**Secrets** (set in GitHub repository settings):
- `DO_SPACES_ACCESS_KEY` - DigitalOcean Spaces access key
- `DO_SPACES_SECRET_KEY` - DigitalOcean Spaces secret key

**Variables** (set in GitHub repository settings):
- `DO_SPACES_BUCKET` - DigitalOcean Spaces bucket name
- `DO_SPACES_ENDPOINT` - DigitalOcean Spaces endpoint URL (e.g., `https://nyc3.digitaloceanspaces.com`)
- `DO_SPACES_REGION` - DigitalOcean Spaces region (e.g., `nyc3`) [optional, defaults to `nyc3`]

## DigitalOcean Spaces Setup

### 1. Create a Space

1. Go to the DigitalOcean control panel
2. Navigate to Spaces
3. Create a new Space
4. Configure as public for script tag access
5. Note the bucket name and endpoint URL

### 2. Generate API Keys

1. Go to API section in DigitalOcean control panel
2. Generate a new Spaces access key
3. Note the access key ID and secret key

### 3. Configure CORS (if needed)

If you encounter CORS issues, configure the Space's CORS policy:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

## Usage Examples

See [usage.md](./usage.md) for detailed integration examples.

## Troubleshooting

### Bundle Not Loading

1. Check browser console for network errors
2. Verify the bundle URL is accessible
3. Check CORS configuration if loading from different domain

### Editor Initialization Failing

1. Ensure all required callback functions are provided
2. Check browser console for initialization errors
3. Verify canvas element is properly configured

### Performance Issues

1. Consider using the versioned URL for better caching
2. Implement lazy loading if bundle is too large
3. Monitor bundle size in deployment summaries

## Development

### Local Bundle Generation

```bash
# Generate bundle locally
npm run bundle:editor

# Test bundle
open test-bundle.html
```

### Manual Deployment

```bash
# Deploy manually (requires AWS CLI configured)
npm run bundle:editor
aws s3 cp packages/editor/bundle/editor-bundle.js s3://[bucket]/editor/ --endpoint-url [endpoint] --acl public-read
```