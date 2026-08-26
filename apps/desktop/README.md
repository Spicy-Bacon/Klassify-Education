# Desktop Application

The desktop client is a C++ and Qt application foundation for media-heavy school workflows such as photography ingest, event organization and future audio/video processing.

Current scope:

- Display a development screen.
- Link against the shared C++ core when Qt is available.
- Avoid real media processing until product requirements are validated.

Build through the repository root:

```bash
cmake -S . -B build
cmake --build build
```
