# X Clone

This repository is being used to build an X-like social platform with:

- `Node.js` for the main backend
- `Go` for media and heavy async processing
- `PostgreSQL` as the primary datastore
- `Redis` for caching and hot-path support
- `React + Vite` for the dashboard
- `Expo + React Native` for the mobile app

## Architecture Docs

- [Project Brief](./docs/project-brief.md)
- [System Design](./docs/system-design.md)
- [Implementation Roadmap](./docs/implementation-roadmap.md)
- [Dev Workflow](./docs/dev-workflow.md)
- [Secrets Guide](./docs/secrets.md)

## Current Repo Base

The repo is now a multi-app workspace for:

- backend microservices
- dashboard
- Expo mobile app
- Go media worker
- local infra via Docker Compose
