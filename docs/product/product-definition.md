# Product Definition Reference

This public repository contains an engineering summary of externally maintained,
confidential product and business planning sources:

- Product Definition v0.1, dated 26 August 2026
  (`AI_School_Platform_Product_Definition_v0.1.docx`).
- English business plan.
- Traditional Chinese business plan.

The original documents remain outside this public repository. This milestone
uses the user-approved brief and repository evidence; it does not claim a new
reading of confidential originals or business-plan revisions unavailable here.
Do not add confidential originals to Git.

## Product Summary

Klassify is a modular school operations, communication, AI and media ecosystem:

- Connect: announcements, messaging, forms, calendars, translation,
  notifications and reminders.
- Manage: attendance, leave, events, approvals, documents and teacher workflows.
- Capture: photography, web-based upload, private galleries, events, consent
  and selections; future video/live-media services remain deferred.

Use photography relationships as the commercial entry into media and Connect.
AI assists with drafts, translation, summaries and authorised school-document
Q&A; consequential output and external communications require human review.

## Approved Engineering Direction

[ADR 0001](../architecture/decisions/0001-web-mobile-product-surfaces.md)
records the user-approved web/mobile direction and supersedes the provisional
desktop/C++ technical direction in v0.1. It does not replace the product pillars
or imply that all mobile roles need separate apps.

Admin Web, native staff and parent experiences, and pilot-prioritised student
mobile or responsive web are the active surfaces. Media administration starts
on web; backend, authentication, database, hosting, AI and storage providers
remain open.

See the [roadmap](mvp-roadmap.md) for development foundations, pilot scope,
business validation and production gates. A first main merge is a foundation
checkpoint, not a completed MVP.
