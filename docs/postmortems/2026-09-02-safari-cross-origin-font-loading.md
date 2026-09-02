# Postmortem: Safari Failed to Load a Cross-Origin Web Font

**Date:** September 2, 2026
**Status:** Resolved
**Severity:** Low (incorrect typography in Safari)

## Summary

Safari failed to load the Departure Mono web font used by `8f4e.com`, while Chrome and Firefox loaded it successfully. Safari's Network inspector reported only "An error occurred trying to load the resource" and rendered the fallback font.

The font was served from `cdn.polgarand.org`, making it cross-origin relative to `8f4e.com`. Because the website uses `Cross-Origin-Embedder-Policy: require-corp`, Safari required the font response to explicitly permit cross-origin embedding with `Cross-Origin-Resource-Policy: cross-origin`, in addition to its existing CORS header.

## Investigation

- Confirmed that current Safari versions support WOFF2.
- Confirmed that the response used the correct `font/woff2` content type.
- Confirmed that `Access-Control-Allow-Origin: https://8f4e.com` was present.
- Loaded the font successfully through macOS CoreText, ruling out an invalid or unsupported font binary.
- Found that `8f4e.com` enabled cross-origin isolation with `Cross-Origin-Embedder-Policy: require-corp`, while the font response did not include a Cross-Origin Resource Policy header.

## Root Cause

The cross-origin CDN response had a valid CORS policy but did not explicitly opt into cross-origin embedding through CORP. Safari enforced the website's COEP policy for the font request and rejected the response. Chrome and Firefox accepting the same response initially obscured the missing header.

This does not mean Safari requires CORP for every WOFF2 font. It was required here because the font was cross-origin and the embedding page used `Cross-Origin-Embedder-Policy: require-corp`.

## Resolution

A Cloudflare Response Header Transform Rule was added for the font:

```text
When:
  http.host eq "cdn.polgarand.org"
  and starts_with(http.request.uri.path, "/fonts/")

Set response header:
  Cross-Origin-Resource-Policy: cross-origin
```

The resulting response contains both required headers:

```text
Access-Control-Allow-Origin: https://8f4e.com
Cross-Origin-Resource-Policy: cross-origin
```

## Lessons Learned

- A correct CORS policy does not always cover the requirements imposed by COEP.
- Cross-origin assets used by a page with `COEP: require-corp` should explicitly provide a compatible CORP header.
- Browser-specific resource errors can be misleading; validate the file itself before assuming a format compatibility problem.
- Test cross-origin isolated pages in Safari as well as Chromium and Firefox.
- Cloudflare rules that modify browser-visible headers must be Response Header Transform Rules, not Request Header Transform Rules.

## Prevention

When adding a new cross-origin CDN asset to an isolated 8f4e page:

1. Return an appropriate `Access-Control-Allow-Origin` header.
2. Return `Cross-Origin-Resource-Policy: cross-origin` when the asset is intended to be embedded across sites.
3. Scope the Cloudflare rule to the smallest practical host and path.
4. Verify the final response headers with a cache-miss request and test the deployed page in Safari.

## References

- [WebKit: Improved Font Loading](https://webkit.org/blog/6643/improved-font-loading/)
- [WebKit bug: Incorrect CORP/COEP check in cached responses](https://bugs.webkit.org/show_bug.cgi?id=238238)
- [Cloudflare Response Header Transform Rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
