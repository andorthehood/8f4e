# Postmortem: Git Push Failed with "bad object" Error

**Date:** November 3, 2025  
**Status:** Resolved  
**Severity:** Medium (blocked deployment, local repository out of sync)

## Summary

A `git push` operation failed with a cryptic "bad object" error, preventing code from being pushed to the remote repository. The error indicated Git couldn't find a specific commit object (`c653f110ce94aba46d64cf6581c39c3f4a363b12`) that the remote was referencing, even though the local repository passed integrity checks.

## Timeline

- **Initial Error:** `git push` failed with error message:
  ```
  ref main:: Error in git rev-list --stdin --objects --not --remotes=origin --: 
  exit status 128 fatal: bad object c653f110ce94aba46d64cf6581c39c3f4a363b12
  ```
- **Investigation:** Ran `git fsck --full` - repository integrity was fine locally
- **Verification:** Confirmed object `c653f110` didn't exist in local repository
- **Discovery:** Remote's `main` branch was pointing to a commit not present locally
- **Root Cause Identified:** Local and remote branches had diverged after a PR merge
- **Resolution:** Fetched remote changes and rebased local commits

## Root Cause

The local `main` branch and `origin/main` had diverged due to a GitHub PR merge workflow mismatch:

### What Happened:

1. **Feature Branch Created:** `copilot/fix-747365-313701704-69f2e00f-35a3-4185-b39d-2cfcbcc425b1`
2. **Local Development:** Committed changes to the feature branch
3. **Merged Feature Branch Locally:** Fast-forwarded local `main` to the feature branch HEAD (`68d204cd`)
4. **PR Merged on GitHub:** Meanwhile, GitHub merged PR #115, creating a merge commit (`c653f110`)
5. **Divergence:** Local `main` pointed to `68d204cd`, remote `main` pointed to `c653f110`

### Why the "Bad Object" Error Occurred:

When attempting to push, Git tried to calculate which objects to send:
```bash
git rev-list --stdin --objects --not --remotes=origin
```

This command compares local commits against remote refs. However:
- The remote was referencing commit `c653f110` (the merge commit)
- This commit didn't exist in the local repository yet
- Git interpreted this as a corrupted/missing object

The error was misleading because:
- The local repository was healthy (passed `git fsck`)
- The issue was **synchronization**, not corruption
- The "bad object" was actually just a missing object that existed on the remote

## Branch Divergence Visualization

```
Before fetch:
Local main:  68d204cd ← HEAD (local commit on feature branch)
Remote main: c653f110 ← origin/main (merge commit, UNKNOWN locally)

After fetch:
Local:        68d204cd ← HEAD (main)
              |
Remote:       c653f110 ← origin/main (merge commit)
             /        \
         1b5d7679    c4553292
         (remote)    (local, older version)

After rebase:
Remote & Local: c653f110 ← origin/main
                68d204cd ← main (rebased on top)
```

## Impact

- **User Impact:** Could not push code changes to remote repository
- **Development Flow:** Temporarily blocked from deploying changes
- **Data Loss:** None - all commits were preserved
- **Duration:** ~5 minutes from error to resolution

## Resolution

### Steps Taken:

1. **Verified Repository Integrity:**
   ```bash
   git fsck --full
   # Result: Only dangling commit (normal), no corruption
   ```

2. **Confirmed Missing Object:**
   ```bash
   git cat-file -t c653f110ce94aba46d64cf6581c39c3f4a363b12
   # Result: fatal: could not get object info
   ```

3. **Fetched Remote Changes:**
   ```bash
   git fetch origin --prune
   # Downloaded merge commit c653f110 and updated refs
   ```

4. **Rebased Local Changes:**
   ```bash
   git pull --rebase origin main
   # Replayed local commit on top of remote merge commit
   ```

5. **Pushed Successfully:**
   ```bash
   git push
   # Result: Success ✓
   ```

## Lessons Learned

### What Went Well:
- Repository integrity was maintained throughout
- `git fsck` quickly ruled out actual corruption
- Reflog provided clear history of what happened locally
- `git fetch` successfully retrieved missing objects

### What Could Be Improved:
- Better understanding of GitHub PR merge workflows
- More careful synchronization between local and remote branches
- Could have avoided divergence by pulling before merging locally

### Key Insights:
1. **"Bad object" doesn't always mean corruption** - it can also mean "object doesn't exist locally"
2. **GitHub PR merges create merge commits** that may not exist in local branches
3. **Fast-forward merges locally can diverge** from GitHub's merge strategy
4. **Always fetch before force operations** to ensure you have the latest remote state

## Prevention

### Recommended Workflow:

1. **Before merging locally, check remote status:**
   ```bash
   git fetch origin
   git status  # Check if remote has new commits
   ```

2. **After PR is merged on GitHub:**
   ```bash
   git fetch origin
   git checkout main
   git pull --rebase origin main  # or git pull --ff-only
   git branch -d feature-branch   # Clean up local feature branch
   ```

3. **Alternatively, delete local main after PR merge:**
   - Let GitHub handle the merge
   - Delete and recreate local `main` from `origin/main`
   ```bash
   git fetch origin
   git checkout -B main origin/main  # Force reset to remote
   ```

### Process Improvements:

- [ ] Document preferred Git workflow for PR merges in team guidelines
- [ ] Consider using GitHub's "Squash and merge" or "Rebase and merge" for cleaner history
- [ ] Add pre-push hook to check if local/remote have diverged
- [ ] Consider using `git pull --rebase` as default configuration:
  ```bash
  git config pull.rebase true
  ```

## Action Items

- [x] Resolve immediate push failure
- [x] Document incident in postmortem
- [ ] Add Git workflow documentation to project README or docs/
- [ ] Review team's Git merge strategies for consistency
- [ ] Consider configuring Git to prefer rebase on pull by default

## References

- Git documentation: [git-rev-list](https://git-scm.com/docs/git-rev-list)
- GitHub documentation: [About pull request merges](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges)
- Related: Dealing with diverged branches in distributed Git workflows

## Additional Notes

This type of error is common when:
- Working with multiple developers on the same branch
- Using GitHub's web UI to merge PRs while having local changes
- Force-pushing on shared branches (though not applicable here)
- Network interruptions during fetch/push operations

The key lesson is to always keep local and remote branches synchronized, especially after PR merges on GitHub.
