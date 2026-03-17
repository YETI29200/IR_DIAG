# Maintenance Skill

This skill contains procedures and scripts for maintaining the IR_DIAG_IA platform.

## Database Management
Use the following bash scripts for database operations:

- `scripts/check_database.sh`: Verifies the integrity and schema of the SQLite database.
- `scripts/restart_server.sh`: Cleanly stops all node processes and restarts the dev environment.

## Troubleshooting
If you encounter a 503 error, it is likely an external API capacity issue. 
If you encounter a 500 error with `SQLITE_ERROR`, check the `schema.sql` against the current database using `check_database.sh`.
