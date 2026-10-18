# Releases and Production Deployment

To release and deploy production, manually run the **Release** GitHub Actions workflow from `main`.
The workflow rejects other branches. Pushes and merges to `main` run checks without deploying.

The entry workflow in `.github/workflows/release.yml` only defines the stage order and permissions. Each stage is
implemented by a focused reusable workflow beside it: `release-prepare.yml`, `release-verify.yml`,
`release-publish.yml`, and `release-deploy.yml`.

The workflow performs these stages:

1. The preparation job versions packages with Nx, creates release tags, and saves that unpushed Git state as a
   workflow artifact.
2. Two jobs restore the prepared release and run in parallel. One runs tests and records test coverage. The other
   builds both websites and records bundle size, bytecode size, compiler coverage, and TSDoc coverage metrics.
3. The publishing job restores the same prepared release, combines the generated metrics, commits any changes, and
   atomically pushes the release commits and tags to `main`.
4. After the push succeeds, two jobs deploy the saved website artifacts in parallel: 8f4e.com to the `8f4e-website`
   Cloudflare Pages project and editor.8f4e.com to the `8f4e` project. Both deployments use their production `main`
   branch.

A failed check or build prevents the release push and deployments. A failed release push prevents deployments.
Both deployments use immutable artifacts built from the prepared release, including its version changes.

The repository must provide the `CLOUDFLARE_API_TOKEN` Actions secret and the `CLOUDFLARE_ACCOUNT_ID` Actions
variable. Existing release tags are required; the workflow refuses to initialize a first release.
