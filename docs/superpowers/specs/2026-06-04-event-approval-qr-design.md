# Event Approval and QR Design

Staff-created events require admin review before users can see or join them. Creating an event should still create the default evaluation and QR immediately, but the event remains private until an admin approves and publishes it.

## Design

- Add `approval_status` to events with `Pending`, `Approved`, and `Rejected`.
- Add `published_at` to mark when an approved event becomes visible.
- Staff-created events default to `approval_status = Pending`, `is_public = false`, and an unpublished evaluation.
- Admin-created events default to `approval_status = Approved`; their visibility follows `is_public`.
- Event creation returns an event QR code and event URL immediately.
- Admin can approve, reject, publish, or unpublish events.
- Users only see and open events with `approval_status = Approved` and `is_public = true`.
- Staff can still see their own pending or rejected events.

## Testing

Backend controller tests cover staff creation defaults, user visibility filtering, and admin approval actions. Frontend verification uses the existing Vite build.
