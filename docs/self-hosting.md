# Self-Hosting The 8f4e Editor

The 8f4e editor can be hosted as static files after building the web app. A static host is fine as long as it can serve custom response headers.

The editor uses worker-based runtimes that require the page to be cross-origin isolated. Browsers only expose `SharedArrayBuffer` and report `self.crossOriginIsolated === true` when the document is served with both of these headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

For static hosts such as Netlify, GitHub Pages, or Cloudflare Pages, verify that the host supports custom headers before using it for the editor. If these headers are missing, worker runtimes that depend on shared memory will fail even if the files themselves are deployed correctly.

As of May 6, 2026, GitHub Pages still does not support configuring the COOP and COEP response headers needed for cross-origin isolation. Netlify and Cloudflare Pages do support custom headers, including `_headers` file based configuration.

On hosts that support a `_headers` file, configure the editor route like this:

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

If a deployment loads third-party resources, those resources must also be compatible with cross-origin isolation. If `require-corp` blocks required assets, evaluate whether `Cross-Origin-Embedder-Policy: credentialless` is appropriate for that deployment.
