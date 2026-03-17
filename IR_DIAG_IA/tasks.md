# Task: Resolve Service Unavailability & Restore Database

## Current Status
- AI Service encountered ephemeral 503 Capacity Error.
- Database `./data/diagnostic.db` has `missions_old` instead of `missions`.
- `npm run dev` is running but likely failing on some routes due to missing table.

## Steps
1. [x] Stop and restart server (Clean start).
2. [x] Investigate database schema manually.
3. [ ] Create/Update Skills with PowerShell and Bash support.
4. [ ] Fix database schema issues (Restore/Migrate missions table).
5. [ ] Verify application functionality.
