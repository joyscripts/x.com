# Dev Workflow

## What Turbo Is Doing

`turbo` is the task runner for the monorepo.

It does not replace Node, Expo, or Vite.
It just runs the right script in the right workspace packages.

Examples:

- `yarn dev` runs every workspace `dev` script that has one
- `yarn check-types` runs `check-types` across the repo
- `yarn lint` runs lint across the repo
- `yarn test` runs tests across the repo

Think of it as:

- one command at the root
- many package scripts underneath

## Recommended Local Development Flow

### 1. Start infrastructure only

```sh
yarn infra:up
```

This starts:

- Postgres
- Redis
- RabbitMQ
- MinIO
- OpenSearch
- OpenSearch Dashboards

Useful URLs:

- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ UI: `http://localhost:15672`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- OpenSearch: `http://localhost:9200`
- OpenSearch Dashboards: `http://localhost:5601`

### 2. Run backend services on your machine

```sh
yarn dev:backend
```

This starts:

- `api-gateway`
- `auth-service`
- `user-service`
- `social-graph-service`
- `post-service`
- `timeline-service`
- `notification-service`
- `search-service`
- `admin-service`
- `media-service`

### 3. Run client apps on your machine

In a separate terminal:

```sh
yarn dev:clients
```

This starts:

- dashboard with Vite
- Expo mobile app

## When To Use Full Docker Mode

If you want to see all backend services and infra running in containers:

```sh
yarn services:docker
```

That uses the root `docker-compose.yml` with the `apps` profile enabled.

## Best Practice For Day-To-Day Work

For most development, use:

1. `yarn infra:up`
2. `yarn dev:backend`
3. `yarn dev:clients`

Why:

- faster restarts
- easier debugging
- easier logs
- better DX than containerizing every edit cycle

## How To Run Only One Service

Turbo supports filtering.

Examples:

```sh
yarn turbo run dev --filter=@x-clone/api-gateway
yarn turbo run dev --filter=@x-clone/auth-service
yarn turbo run dev --filter=@x-clone/dashboard
```

You can use the same idea for checks:

```sh
yarn turbo run check-types --filter=@x-clone/post-service
yarn turbo run test --filter=@x-clone/api-gateway
```

## Docker Compose Modes

### Infra only

```sh
docker compose up -d
```

### Infra + app containers

```sh
docker compose --profile apps up --build
```

### Stop everything

```sh
docker compose down
```

### Stop and remove volumes

```sh
docker compose down -v
```

## Notes About Mobile

The Expo app is scaffolded in the repo, but running Expo directly on your machine is usually better than containerizing it for daily development.

That is why the root Compose file does not include a mobile container.

## Notes About Node Version

The workspace is configured for Node `24+`.

If your local machine is on an older version, switch first or package-manager engine checks may fail.
