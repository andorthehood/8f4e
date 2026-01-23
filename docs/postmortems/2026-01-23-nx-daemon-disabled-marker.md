# Postmortem: Nx Daemon Disabled by EPERM Socket Error

**Date:** January 23, 2026  
**Status:** Resolved  
**Severity:** Medium (dev watch targets blocked)

## Summary
The Nx daemon auto-disabled itself after hitting an `EPERM` while binding its Unix socket, leaving the workspace without a running daemon. Multiple restart attempts kept failing with the same socket error until the disabled marker was removed. Nx reported the daemon as running, so the only visible symptom was `nx watch` (and watch-backed targets like `app:dev`) failing with "Daemon is not running" even though builds succeeded.

## Timeline
- ~14:57 UTC — Nx daemon attempts to start, hits `EPERM` binding `/private/var/folders/.../d.sock` and writes the disabled marker. See `.nx/workspace-data/d/daemon.log` and `.nx/workspace-data/d/daemon-error.log`.
- 15:01 UTC — Follow-up daemon restart also fails with the same `EPERM`; watcher stops.
- 16:57 UTC — Running `nx run app:dev` reports "Daemon is not running. The watch command is not supported without the Nx Daemon." and exits non-zero.
- 17:05 UTC — With AI agent assistance, investigated `.nx/workspace-data/d/disabled` marker and `daemon-error.log` showing the `EPERM` stack trace.
- 17:06 UTC — Removed `disabled` and `daemon-error.log`, then ran `npx nx daemon --stop && npx nx daemon --start` to restart cleanly.
- 17:07 UTC — Verified `nx watch` no longer complains about the daemon; watch can run (manual run was terminated with Ctrl+C).

## Root Cause
The daemon process failed to bind its Unix domain socket with `Error: listen EPERM: operation not permitted .../d.sock`. This likely stemmed from a stale socket file or macOS sandbox permission hiccup. When daemon startup fails, Nx writes `.nx/workspace-data/d/disabled` to short-circuit further client attempts, which then causes all watch-based commands to bail out immediately.

## Impact
- `nx watch` and any targets that depend on it (e.g., `app:dev`) failed immediately with a "Daemon is not running" message.
- Regular builds still worked, but file watching and incremental rebuilds were unavailable.

## Resolution
- Deleted `.nx/workspace-data/d/disabled` and `.nx/workspace-data/d/daemon-error.log`.
- Restarted the daemon via `npx nx daemon --stop && npx nx daemon --start`.
- Re-ran `nx watch` with `NX_DAEMON=true`; the daemon responded and the watch started (session was manually stopped). Prior restarts without clearing the disabled marker did not recover the daemon.

## Lessons Learned
- Nx will auto-disable the daemon after a failed startup; the presence of `.nx/workspace-data/d/disabled` is a clear indicator, but there is no outward CLI signal beyond watch commands failing. `npx nx daemon --status` reported the daemon as running even while watch commands failed. Multiple restarts alone did not clear the disabled state.
- Socket `EPERM` on macOS can arise from stale sockets or permission glitches; cleaning the daemon data and restarting is a fast recovery.
- The repo expects Node v22.15.1 (per [AGENTS.md](../../AGENTS.md)); running under a different Node (log showed v24.11.1) may contribute to unexpected daemon behavior.

## Prevention
1. **Preflight check:** If `nx watch` reports the daemon is not running, immediately inspect `.nx/workspace-data/d/daemon-error.log` and remove `.nx/workspace-data/d/disabled` before restarting.
2. **Node version hygiene:** Use `nvm use 22.15.1` in this repo to avoid daemon/env drift.
3. **Stale socket cleanup:** On repeated `EPERM`, remove the socket path by stopping the daemon and deleting `.nx/workspace-data/d` before restarting to clear any lingering permissions.

## References
- Logs: [.nx/workspace-data/d/daemon.log](.nx/workspace-data/d/daemon.log)
- Error marker: [.nx/workspace-data/d/disabled](.nx/workspace-data/d/disabled)
- Nx daemon command: `npx nx daemon --start`
