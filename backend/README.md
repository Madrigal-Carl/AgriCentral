# Backend maintenance

## Request auto-deny

The backend starts a request auto-deny sweep immediately after connecting to
MongoDB, then repeats it every minute. Requests still awaiting review are denied
after seven days without an update. Successful edits or approval decisions reset
the inactivity clock; fully approved, denied, archived or released requests are
not expired.

- `AUTO_DENY_DAYS` defaults to `7`.
- `AUTO_DENY_INTERVAL_MINUTES` defaults to `1`.
- Overlapping scheduled sweeps are skipped. Failures are logged and retried at
  the next interval. Each sweep processes at most 50 candidates; further batches
  are handled by subsequent sweeps.
- Keep the backend running for automatic checks. After a restart, the immediate
  sweep catches up on overdue requests. A sleeping/stopped host cannot run timers.
- The protected `POST /api/cron/auto-deny-requests` endpoint remains available for
  optional external scheduling using the `x-cron-secret` header.

## Unique association positions

Only **Member** can repeat within an association. All other positions, including
**Director**, must be unique among non-archived farmers in that association.

Reset the application data, synchronize the current database indexes (including the
unique Director position), and seed fresh data using the existing command:

```sh
npm run seed
```

**Warning:** This wipes existing application records before reseeding. Maintenance
reference data is preserved and upserted. Indexes on application model collections
are synchronized with their schemas: obsolete or changed indexes are removed and
current indexes are created. This also replaces older string-based location
indexes with ObjectId-based indexes. No separate migration command is needed.
