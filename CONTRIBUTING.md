# Contributing

## Workflow

1. Branch from `develop`.
2. Use meaningful branch names such as `feature/identity-model`, `fix/attendance-date-handling` or `refactor/contract-layout`.
3. Keep commits focused.
4. Run relevant tests before committing.
5. Open pull requests against `develop`.
6. Use squash merge for most feature pull requests unless preserving history has a clear benefit.
7. Keep `main` release-ready.

## Commit Convention

Use concise conventional prefixes where practical:

```text
feat:
fix:
refactor:
docs:
test:
build:
ci:
chore:
```

## Architecture and Validation

Follow the [web/mobile surface decision](docs/architecture/decisions/0001-web-mobile-product-surfaces.md).
Keep mobile packaging open and do not reintroduce desktop scaffolding without
pilot evidence. Use the [validation guide](docs/development/validation.md) for
Web and native mobile checks; historical build records are not current setup instructions.

The first `develop` to `main` merge is a foundation checkpoint. Production use
requires the [roadmap gates](docs/product/mvp-roadmap.md), including server-side
permissions and tenant isolation; client-side development checks do not replace them.

## Privacy and Security

Never commit:

```text
.env
API keys
certificates
private keys
school data
student data
parent data
production media
```

Privacy, tenant isolation, permission correctness and media consent are product requirements, not optional follow-up work.
