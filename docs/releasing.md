# Releases and Production Deployment

To release and deploy production, manually run the **Release** GitHub Actions workflow from `main`.
The workflow rejects other branches. Pushes and merges to `main` run checks without deploying.

The release job performs these steps in order:

1. Version packages with Nx and create release tags.
2. Build the editor website, collect release metrics, and run tests with coverage.
3. Commit changed release metrics and build the 8f4e.com website, including its bundled example modules.
4. Atomically push the release commits and tags to `main`.
5. Deploy 8f4e.com to the `8f4e-website` Cloudflare Pages project on its production `main` branch.

A failed check or build prevents the release push and deployments. A failed release push prevents deployments.
The deployment uses the same checkout as the release, including its version changes.

The repository must provide the `CLOUDFLARE_API_TOKEN` Actions secret and the `CLOUDFLARE_ACCOUNT_ID` Actions
variable. Existing release tags are required; the workflow refuses to initialize a first release.
