# 031: projectUrl Fetch Constraints

## Context
The app accepts `?projectUrl=` and fetches a remote `.8f4e` project file in the browser. This enables flexible sharing and loading, but the URL is untrusted input.

## Goal
Keep URL-based loading, but constrain fetch behavior to reduce abuse and accidental instability.

## Agreed Constraints
1. Validate URL shape before fetch.
- Require `https:`.
- Reject URLs with credentials (`username:password@`).
- Prefer `.8f4e` suffix on the pathname.

2. Enforce timeout.
- Use `AbortController`.
- Suggested default: 8-10 seconds.

3. Limit response size.
- Enforce a max payload cap while reading response body.
- Suggested default: 1 MB.
- Abort if cap is exceeded.

4. Guard response type.
- Require a text-like content type (for example `text/plain`) or other explicitly accepted type.
- Reject clearly incompatible content types.

5. Error/fallback behavior.
- If validation/fetch fails, do not crash startup.
- Continue normal fallback path (localStorage/default project).
- Keep error logs explicit (timeout, too large, invalid URL, bad response, etc.).

6. URL hygiene.
- Continue removing `projectUrl` from the address bar after recognition via `history.replaceState`.

## Optional Hardening
1. Host allowlist mode.
- Allow any `https` URL by default.
- Optional strict mode for trusted hosts only.
- Planned UX: maintain a domain allowlist of trusted sources; if a URL is not trusted, show an overlay warning before loading.

2. Network target blocking.
- Consider blocking localhost and private IP ranges to reduce client-side probing risks.

3. Telemetry.
- Add lightweight counters for validation failures/timeouts/oversize responses.

## Planned Warning Copy (Untrusted Source Overlay)
Title: `Untrusted Project Source`

Body:
- This project comes from a domain that is not on the trusted list.
- If you continue, the project may contain expensive or infinite execution paths that can freeze or crash this tab.
- 8f4e programs cannot make network requests; the only network contact is fetching this project URL.
- The source host can still observe that fetch (IP/user-agent/timestamp), and content at the URL may change over time.

Actions:
- `Cancel`
- `Load Anyway`
- `Trust this domain` (optional explicit opt-in)

## Proposed Constants
- `PROJECT_URL_TIMEOUT_MS = 10_000`
- `PROJECT_URL_MAX_BYTES = 1_000_000`

## Implementation Sketch
1. Parse and validate `projectUrl`.
2. Start fetch with timeout signal.
3. Stream response and enforce byte cap.
4. Decode as UTF-8 text.
5. Parse as `.8f4e` project.
6. On failure, log reason and continue fallback flow.

## Out of Scope
- This note does not change parser/compiler semantics.
- Parsing in worker is already in place and remains unchanged.
