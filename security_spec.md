# Security Specification - Les Bozo de JB

## 1. Data Invariants

1. **Ticket Invariant**: A Ticket must have a non-empty `studentName` (1-60 chars), `category` (1-50 chars), `description` (2-1000 chars), and a valid `status` in `['waiting', 'in_progress', 'resolved', 'cancelled']`.
2. **Immutability of Identity & Creation**: `createdAt` cannot be modified on update.
3. **Status Transitions**: Tickets can transition from `waiting` to `in_progress` or `resolved` or `cancelled`. Once `resolved`, they cannot be altered by unauthorized callers.
4. **Screenshot Boundary**: `screenshotUrl` if present cannot exceed 400,000 characters to prevent wallet/storage denial-of-service.
5. **Session Invariant**: `classSessions` hold aggregated metrics and session identifiers.

## 2. The "Dirty Dozen" Payloads (Rejection Matrix)

1. **Payload 1 (Ghost Field Injection)**:
   Attempting to inject `isAdmin: true` or `shadowField: "exploit"` in a ticket write.
   *Expected: PERMISSION_DENIED (strict hasOnly keys).*
2. **Payload 2 (Student Name Exceeding Limit)**:
   `studentName` string > 60 characters or empty string `""`.
   *Expected: PERMISSION_DENIED (size bounds).*
3. **Payload 3 (Invalid Ticket Status)**:
   `status: "superadmin_approved"`.
   *Expected: PERMISSION_DENIED (status enum validation).*
4. **Payload 4 (Massive Screenshot Exploit)**:
   `screenshotUrl` exceeding 400,000 bytes.
   *Expected: PERMISSION_DENIED (screenshot size bound).*
5. **Payload 5 (Description Length Exploit)**:
   `description` exceeding 1000 characters.
   *Expected: PERMISSION_DENIED (description size bound).*
6. **Payload 6 (Invalid Document ID)**:
   Path `{ticketId}` containing characters outside `[a-zA-Z0-9_\-]` or > 128 chars.
   *Expected: PERMISSION_DENIED (isValidId guard).*
7. **Payload 7 (Tampering with createdAt)**:
   Updating an existing ticket while changing `createdAt` from its initial value.
   *Expected: PERMISSION_DENIED (createdAt immutability).*
8. **Payload 8 (Arbitrary Deletion)**:
   Unauthenticated arbitrary user deleting all documents in batch.
   *Expected: PERMISSION_DENIED.*
9. **Payload 9 (Unauthorized Session Mutation)**:
   Malicious client attempting to overwrite `classSessions` with invalid schema fields.
   *Expected: PERMISSION_DENIED.*
10. **Payload 10 (Urgency Injection)**:
    `urgency: "critical_bypass"` (not in `['normal', 'blocking', 'quick_question']`).
    *Expected: PERMISSION_DENIED.*
11. **Payload 11 (Empty Category)**:
    `category: ""` (empty category).
    *Expected: PERMISSION_DENIED.*
12. **Payload 12 (Client-Side Arbitrary Collection Scraping)**:
    Querying random non-whitelisted collections `/{document=**}`.
    *Expected: PERMISSION_DENIED (Global deny catch-all).*
