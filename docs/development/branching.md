# Branching

## Branch Model

```text
main
└── develop
    ├── feature/*
    ├── fix/*
    └── refactor/*
```

`main` represents production and stable releases. `develop` is the active integration branch. Normal work must branch from `develop` and return through pull request review.

## Feature Workflow

```bash
git checkout develop
git pull
git checkout -b feature/<feature-name>
```

Open pull requests against `develop`. Do not merge feature branches directly into `main`.
