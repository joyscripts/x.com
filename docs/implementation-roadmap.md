# X Clone Implementation Roadmap

Last audited: 2026-07-01

This roadmap is the build sequence for the repo. For a point-in-time checklist of what exists now, use `progress-tracker.md`.

The project is still intentionally microservice-first because the learning goals are service decomposition, service communication, event-driven workflows, distributed caching, observability, and load testing.

## Current Baseline

The repo is past the initial skeleton stage.

Implemented or partially implemented:

- Yarn/Turbo monorepo with shared contracts/config packages.
- Fastify-based Node services for gateway, auth, user, social graph, post, timeline, notification, search, admin, and media.
- Docker Compose infrastructure for Postgres, Redis, RabbitMQ, MinIO, OpenSearch, and app containers.
- Health checks and focused tests across all services.
- Auth OTP/session flow with Redis OTP storage/rate limits, JWT access tokens, refresh-token rotation, user bootstrap, and notification event publishing.
- User profile bootstrap/read/update.
- Post create/list/get/soft-delete with media attachments.
- Media upload/storage, media metadata, event outbox, Go media worker processing, retries, and DLQ.
- Notification device registration, RabbitMQ consumer, in-app notifications, delivery records, FCM push path, and log SMS/email providers.
- Expo app with auth/profile/compose/home-media slices.
- Vite dashboard scaffold.

Still only scaffolded:

- `social-graph-service`
- `timeline-service`
- `search-service`
- `admin-service`

## Phase 0: Platform Foundation

Status: mostly done.

Completed:

- Chose Fastify for Node services.
- Created `api-gateway`, `auth-service`, `user-service`, `post-service`, `social-graph-service`, `timeline-service`, `notification-service`, `search-service`, `admin-service`, `media-service`, Expo mobile app, React/Vite dashboard, and Go media worker.
- Added Docker Compose for Postgres, Redis, RabbitMQ, MinIO, OpenSearch, OpenSearch Dashboards, app containers, and worker.
- Added service health checks and baseline tests.
- Added shared Zod contracts in `packages/contracts`.

Remaining:

- Add request/correlation ID propagation.
- Add OpenTelemetry, Prometheus/Grafana, and log aggregation.
- Decide whether service-owned databases remain separate DBs on one local Postgres server or move toward schemas/clusters per environment.

## Phase 1: Contracts and Communication

Status: partial.

Completed:

- Shared contract schemas exist for health, auth, users, media, posts, device installations, notifications, and notification events.
- Gateway-to-service calls use explicit HTTP clients and an internal service secret.
- RabbitMQ is wired for auth OTP notification events and media processing events.
- Media worker has retry and DLQ queues.

Remaining:

- Write an event catalog with routing keys, producers, consumers, and idempotency keys.
- Standardize error response format across all services.
- Add correlation ID propagation across gateway, service calls, events, and worker logs.
- Define retry/DLQ policy for each event family, not only media.
- Add idempotency strategy for event consumers and mutating APIs.

## Phase 2: Auth and Identity

Status: partial and usable for local flows.

Completed:

- OTP request and verify APIs.
- Redis OTP storage with TTL and attempt consumption.
- Redis OTP rate limiting by phone, IP, and device when context exists.
- Session table, JWT access tokens, refresh tokens, rotation, reuse detection, and logout.
- Auth service bootstraps users through user-service.
- Gateway auth routes and mobile session hooks.
- OTP notification events published to RabbitMQ.

Remaining:

- Add real provider wiring/configuration for production SMS such as MSG91.
- Add account/session management endpoints.
- Add admin auth and role model.
- Add audit logs for security-sensitive auth events.
- Replace any test-user notification targeting with authenticated user IDs everywhere.

## Phase 3: User Profiles

Status: partial.

Completed:

- User bootstrap by phone number.
- Get user by ID.
- Update profile handle/display name/bio/avatar URL.
- Gateway `/me` and `/me/profile` routes.
- Mobile profile setup screen.

Remaining:

- Add public profile routes and profile screen.
- Add avatar upload integration with media-service.
- Add user settings/privacy fields.
- Emit `user.created` and `user.profile.updated` events.
- Add profile search read model once search-service is active.

## Phase 4: Social Graph

Status: scaffold only.

Completed:

- Service package, Docker wiring, DB client, config, health route, and health tests.

Remaining:

- Follow/unfollow APIs.
- Block/mute APIs.
- Follower/following counts.
- Graph read endpoints for timeline fanout targeting.
- `user.followed`/`user.unfollowed` events.
- Follow notification flow through notification-service.

## Phase 5: Post Creation

Status: partial and usable for local post creation.

Completed:

- Create post.
- List posts globally or by author.
- Get post by ID.
- Soft delete owned post.
- Reply/repost reference columns.
- Media attachment table with position and uniqueness constraints.
- Gateway routes and mobile compose flow.

Remaining:

- Publish `post.created` and `post.deleted`.
- Implement repost and quote-post behavior as first-class product flows.
- Add likes, bookmarks, reply listing, and counters.
- Add edit flow if desired.
- Add moderation/visibility states.
- Connect post events to timeline, search, and notifications.

## Phase 6: Media Pipeline

Status: partial with a working upload/process foundation.

Completed:

- Gateway media upload and streaming routes.
- Media service stores originals in S3-compatible storage and metadata in Postgres.
- Media variants and media event outbox tables.
- `media.uploaded` event shape.
- Go worker consumes RabbitMQ, processes images/videos, writes variants, updates media-service, retries, and DLQs failures.
- Posts can attach uploaded media.

Remaining:

- Add presigned/direct upload flow so API servers do not carry file bodies.
- Add reliable outbox dispatcher lifecycle and monitoring.
- Add media quotas, file validation, antivirus/safety checks, and cleanup.
- Add CDN-ready URL strategy.
- Add user-facing processing states in the mobile app.

## Phase 7: Notifications

Status: partial.

Completed:

- Device installation registration.
- In-app notification storage and read API.
- Notification delivery records.
- RabbitMQ consumer for notification events.
- Notification definitions for `rabbitmq.ping`, `auth.otp.requested`, and `user.followed`.
- Channel fanout across in-app, push, SMS, and email handlers.
- FCM push provider plus log SMS/email providers.
- Gateway notification routes.

Remaining:

- Add notification preferences.
- Add full retry/DLQ strategy for notification event handling.
- Add explicit processed-event idempotency ledger if unique notification rows are not enough.
- Add notification inbox UI polish.
- Add real SMS/email provider adapters.
- Add product producers for follow/like/reply/post events.

## Phase 8: Timeline Service

Status: scaffold only.

Remaining:

- Implement cached home timeline endpoint.
- Consume `post.created` and graph events.
- Implement fanout-on-write for normal users.
- Implement fanout-on-read path for high-follower users.
- Use Redis for timeline references and pagination.
- Hydrate timeline posts through post-service or a dedicated read model.
- Add load-testable celebrity-post strategy.

## Phase 9: Search and Moderation

Status: scaffold only.

Remaining search work:

- Consume user/post events.
- Index users/posts/hashtags into OpenSearch.
- Add search query endpoints.
- Add gateway and mobile search screens.

Remaining moderation/admin work:

- Abuse report APIs.
- Review queues.
- Moderation actions.
- Admin roles/permissions.
- Audit logs.
- Real dashboard workflows.

## Phase 10: Observability and Load Testing

Status: planned.

Load tests to add:

- Concurrent OTP requests.
- Concurrent post creation.
- Timeline-heavy reads.
- Notification bursts.
- Celebrity post fanout.
- Image/video upload bursts.

Metrics to collect:

- p50/p95/p99 latency.
- Queue depth and event lag.
- DB CPU and slow queries.
- Redis hit ratio.
- Worker throughput.
- Failure rate by service.

Deliverables:

- Repeatable load-test scripts.
- Bottleneck report.
- Scaling plan.
- Architecture lessons learned.

## Build Priority From Here

1. Finish social graph MVP.
2. Add post and user domain events.
3. Build timeline MVP on top of graph and post events.
4. Build search indexing/query MVP.
5. Add observability before serious load testing.
6. Expand admin/moderation after the core social loop is event-driven.
