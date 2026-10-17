# Releases and Production Deployment

To release and deploy production, manually run the **Release** GitHub Actions workflow from `main`.
The workflow rejects other branches. Pushes and merges to `main` run checks without deploying.

The release job performs these steps in order:

1. Version packages with Nx and create release tags.
2. Build the editor website, collect release metrics, and run tests with coverage.
3. Commit changed release metrics and build the 8f4e.com website, including its bundled example modules.
4. Verify that both website build outputs exist.
5. Atomically push the release commits and tags to `main`.
6. Deploy 8f4e.com to the `8f4e-website` Cloudflare Pages project and editor.8f4e.com to the `8f4e` project,
   both on their production `main` branch.

A failed check or build prevents the release push and deployments. A failed release push prevents deployments.
Both deployments use the same checkout as the release, including its version changes.

The repository must provide the `CLOUDFLARE_API_TOKEN` Actions secret and the `CLOUDFLARE_ACCOUNT_ID` Actions
variable. Existing release tags are required; the workflow refuses to initialize a first release.

## Cloudflare Git Integration

Cloudflare can also build and deploy directly from GitHub, independently of GitHub Actions. Removing a deployment
workflow does not disable those builds. For each Git-connected Pages project (`8f4e` and `8f4e-website`, if connected):

1. Open the project's **Settings > Build > Branch control** in Cloudflare.
2. Turn off **Enable automatic production branch deployments**.
3. Set **Preview branch** to **None (Disable automatic branch deployments)** and save.

These settings stop builds triggered by commits while allowing the Release workflow to upload both sites with
Wrangler. See [Cloudflare's branch deployment controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).
