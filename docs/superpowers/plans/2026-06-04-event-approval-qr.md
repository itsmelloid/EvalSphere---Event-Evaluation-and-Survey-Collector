# Event Approval QR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin approval and publishing control while automatically creating event QR codes with staff-created events.

**Architecture:** Extend the existing Event model with approval metadata, keep lifecycle `status` separate, and add a small admin-only controller action for approval/publishing. User event reads filter to approved public events; staff/admin reads keep management visibility.

**Tech Stack:** Express, Sequelize, Node assert tests, React, Vite.

---

### Task 1: Backend Approval Behavior

**Files:**
- Modify: `backend/src/models/Event.js`
- Modify: `backend/src/controllers/eventController.js`
- Modify: `backend/src/routes/events.js`
- Test: `backend/src/controllers/eventController.approval.test.js`

- [ ] Write failing controller tests for staff event creation defaults and admin approval actions.
- [ ] Run the test and confirm it fails because approval behavior is missing.
- [ ] Add `approval_status` and `published_at` fields.
- [ ] Return event QR data from event creation.
- [ ] Add admin review action.
- [ ] Run the test and confirm it passes.

### Task 2: Frontend Management UI

**Files:**
- Modify: `frontend/src/utils/helpers.js`
- Modify: `frontend/src/pages/admin/Events.jsx`
- Modify: `frontend/src/pages/staff/Events.jsx`
- Modify: `frontend/src/pages/staff/CreateEvent.jsx`
- Modify: `frontend/src/pages/staff/QRCodes.jsx`

- [ ] Show approval badges in admin and staff event lists.
- [ ] Add admin buttons for approve, reject, publish, and unpublish.
- [ ] Remove staff control over event visibility on create.
- [ ] Show auto-created event QR data in the QR page.

### Task 3: Verification

**Files:**
- Modify: `README.md`

- [ ] Update API/data model docs.
- [ ] Run backend controller tests.
- [ ] Run frontend build.
