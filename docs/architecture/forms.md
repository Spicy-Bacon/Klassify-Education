# Forms and Digital Reply Slips

Phase 5 introduces development-backed Forms and Digital Reply Slips for the Connect pillar. The feature is intentionally scoped to platform-neutral form contracts, Admin Web workflows, and native parent task surfaces. It does not choose production authentication, persistence, cloud infrastructure, notification delivery or a backend API framework.

## Domain Concepts

- `FormDefinition`: school-owned form template with title, description, status, author, audience, deadline, child-context flag and typed questions.
- `FormQuestion`: typed prompt such as acknowledgement, consent, short text, long text, date, single choice or multiple choice.
- `FormAudience`: target scope for school, year group or class audiences.
- `FormRecipient`: generated parent/guardian task for a published form, optionally tied to a specific child.
- `FormSubmission`: submitted answers for one recipient task.
- `Permission`: module capabilities such as `forms.create`, `forms.publish`, `forms.view_responses`, `forms.remind` and `forms.submit`.

## Lifecycle

```text
Draft
  |
  +-- validate audience, deadline and questions
  |
Published ---- reminder request recorded for outstanding recipients
  |
  +-- parent / guardian submits one recipient task
  |
Closed
```

Draft forms may be edited. Published forms generate recipient tasks through the audience resolver. Submitted recipient tasks cannot be submitted again. Closing a form prevents further submissions.

## Audience Resolution

```text
FormDefinition
  |
  +-- School / YearGroup / Class audience
        |
        +-- active students and class enrolments
              |
              +-- active GuardianStudentLink records
                    |
                    +-- FormRecipient tasks
```

If `requiresChildContext` is enabled, each linked child receives a separate task for each guardian. If it is disabled, duplicate guardian recipients are collapsed to a single family-level task.

## Access Rules

- School owner, principal and school admin can manage forms inside their own school.
- Teachers can create, publish and view responses only for forms targeted to classes assigned to them.
- Parent/guardian users can submit only their own recipient tasks and only for linked children when child context exists.
- Student users do not receive form administration access in this phase.
- Cross-school form targeting and submission are rejected at the service/policy boundary.

Roles grant capability only when combined with school and resource scope. Explicit production policy infrastructure is deferred.

## Development Data Boundary

The web implementation uses:

```text
Admin UI
  |
  +-- FormService
        |
        +-- FormRepository
              |
              +-- DevelopmentFormRepository
```

Android and iOS mirror the same boundary in native parent clients with development repositories. Mock data is fictional and uses development-only identifiers and `example.test` email addresses where email data exists.

## Platform Surfaces

- Web Admin: list, filters, detail, draft builder, publish, response tracking and reminder request recording.
- Android Parent: Forms tab, outstanding/submitted tasks, task detail and development-only submission.
- iOS Parent: SwiftUI Forms tab/source foundation, task detail and development-only submission.

## Deferred

- Production authentication and identity provider integration.
- Production database and API implementation.
- Push/email/SMS reminder delivery.
- File uploads inside forms.
- Payment collection.
- Calendar integration.
- AI drafting or summarisation.
- Complex conditional form logic.
- Electronic signature or legal attestation workflows.