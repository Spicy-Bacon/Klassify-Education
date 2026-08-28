# Announcements Development Progress

Branch: feature/announcements
Phase: Phase 3 - Announcements

## Current Milestone
Milestone 4 - Preview, Publish & Schedule

## Completed
- [x] Admin Portal Core verified in develop before starting Phase 3.
- [x] feature/announcements created from latest develop.
- [x] Milestone 1 - Announcement domain
- [x] Shared announcement contracts added.
- [x] Announcement repository abstraction and development repository added.
- [x] Announcement access policy and audience resolver added.
- [x] Announcement service added with draft, publish, schedule, inbox and read tracking foundations.
- [x] Milestone 2 - Admin announcement views
- [x] Admin navigation includes permission-aware Communication / Announcements routes.
- [x] Announcement list and detail routes added.
- [x] Scoped list behavior covered by automated tests.
- [x] Milestone 3 - Draft workflow
- [x] Create announcement route added.
- [x] Edit draft route added.
- [x] Service-backed recipient preview added to the draft form.
- [x] Draft create/edit tests added.
- [x] Announcement security hardening completed.
- [x] Announcement write ownership/scope policy added.
- [x] Empty audience targets are rejected.
- [x] Scheduled announcements must resolve to at least one recipient.
- [x] Public readership summary access now requires user context.
- [x] Normal announcement detail returns aggregate readership only.
- [x] Milestone 4 - Publish and schedule
- [x] Announcement detail actions added for preview, publish now, schedule and cancel schedule.
- [x] Publish/schedule service transitions covered by tests.
- [x] Milestone 5 - Readership tracking
- [x] Development-only recipient inbox added at /dev/inbox.
- [x] Inbox queries use scoped recipient service methods.
- [x] Opening an inbox announcement persists readAt through the repository/service layer.
- [x] Readership totals and recipient-group breakdowns are tested.

## Remaining
- [ ] Milestone 4 - Publish and schedule
- [ ] Milestone 5 - Readership tracking
- [ ] Milestone 6 - Integration and quality

## Last Successful Validation
- npm.cmd test --workspace apps/web
- npm.cmd run lint --workspace apps/web
- npm.cmd run build --workspace apps/web

## Known Issues
- Local Node/npm are unavailable on PATH; validation uses the temporary Node/npm toolchain at C:\Users\yewha\AppData\Local\Temp\node-v22.11.0-win-x64.
- Local CMake availability still needs to be verified for this branch.

## Next Exact Action
Complete dashboard integration, announcement architecture documentation, roadmap updates and final validation.

## Commits
- eef736d feat: add announcement domain foundation
- 546aa5f feat: add announcement administration views
- 82f339d feat: add announcement drafting workflow
- 9d3ddbf fix: harden announcement permissions and targeting
- d2dae67 feat: add announcement publishing workflow
- Pending: feat: add announcement readership tracking

