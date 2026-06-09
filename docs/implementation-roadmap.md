# X Clone Microservices Implementation Roadmap

## 1. Purpose

This roadmap is designed for a **microservice-first build** so you can learn:

- service decomposition
- service communication
- event-driven architecture
- distributed caching
- observability
- load testing and scaling behavior

## 2. Phase 0: Platform Foundation

Goal: create the platform skeleton before product features.

Tasks:

- choose `NestJS` or `Fastify` standard for Node services
- create `api-gateway`
- create `auth-service`
- create `user-service`
- create `post-service`
- create `social-graph-service`
- create `timeline-service`
- create `notification-service`
- create `search-service`
- create `admin-service`
- create `mobile` with Expo
- create `dashboard` with React + Vite
- create `media-worker` in Go

Infra tasks:

- Docker Compose for all dependencies
- Postgres
- Redis
- RabbitMQ
- MinIO or local S3-compatible storage
- OpenSearch
- Prometheus + Grafana

Deliverables:

- all services boot locally
- service discovery via local hostnames
- health checks
- basic tracing/logging

## 3. Phase 1: Contracts and Communication

Goal: define how services talk before heavy feature work.

Tasks:

- define REST conventions
- define event naming conventions
- define correlation ID strategy
- define auth propagation strategy
- define shared error format
- define retry and DLQ policy
- define idempotency strategy

Deliverables:

- service contract docs
- event catalog
- request tracing works across services

## 4. Phase 2: Auth and Identity

Goal: users can sign in and exist in the platform.

Tasks:

- OTP request API
- OTP verify API
- dev-mode console OTP logging
- MSG91 provider adapter
- user creation event
- session/refresh token model
- user profile bootstrap
- auth rate limiting with Redis

Services involved:

- `api-gateway`
- `auth-service`
- `user-service`
- `notification-service`

Deliverables:

- login/signup works from mobile
- new user profile is created through service interaction

## 5. Phase 3: Social Graph

Goal: users can follow each other.

Tasks:

- follow/unfollow APIs
- block/mute APIs
- follower/following counts
- graph events
- graph read endpoints for timeline targeting

Services involved:

- `social-graph-service`
- `user-service`
- `notification-service`

Deliverables:

- graph relationships work
- follow notification flow works

## 6. Phase 4: Post Creation

Goal: core posting flow becomes real.

Tasks:

- create post
- reply
- repost
- quote post
- delete post
- post read endpoints
- publish `post.created`

Services involved:

- `post-service`
- `timeline-service`
- `search-service`
- `notification-service`

Deliverables:

- user can create and interact with posts
- downstream event flow works

## 7. Phase 5: Media Pipeline

Goal: support media without overloading APIs.

Tasks:

- media upload session creation
- presigned upload flow
- object storage integration
- media metadata persistence
- Go image processing worker
- Go video processing worker
- media processed events

Services involved:

- `media-service`
- `media-worker`
- `post-service`

Deliverables:

- user can upload media and attach it to posts

## 8. Phase 6: Timeline Service

Goal: home feed becomes fast and scalable.

Tasks:

- implement cached home timeline
- implement fanout-on-write for normal users
- implement fanout-on-read path for high-follower users
- Redis timeline cache
- pagination model
- feed hydration strategy

Deliverables:

- timeline reads are fast
- celebrity-post strategy is testable

## 9. Phase 7: Notifications

Goal: make the platform reactive and channel-aware.

Tasks:

- in-app notification storage
- SMS notifications
- push token registration
- push provider integration
- notification preferences
- template engine
- delivery retry and DLQ handling

Deliverables:

- follow/like/reply/login OTP notifications work

## 10. Phase 8: Search and Moderation

Goal: platform becomes discoverable and manageable.

Tasks:

- OpenSearch indexing
- search query endpoints
- user/post/hashtag search
- abuse report APIs
- moderation workflows
- admin audit logs

Deliverables:

- search works
- moderation workflows exist

## 11. Phase 9: Load Testing and Scale Experiments

Goal: learn how the architecture behaves under stress.

Tests:

- concurrent OTP requests
- concurrent post creation
- timeline-heavy reads
- notification burst
- celebrity post event
- image/video upload burst

What to measure:

- p50/p95/p99 latency
- queue depth
- DB CPU
- Redis hit ratio
- event lag
- worker throughput
- failure rate by service

Deliverables:

- bottleneck report
- service scaling plan
- architecture lessons learned

## 12. Suggested Learning Sequence

If you want maximum educational value, focus on these concepts in order:

1. API gateway and auth propagation
2. service-owned databases
3. synchronous service calls
4. async events and retries
5. eventual consistency
6. cache strategy
7. observability
8. load testing
9. autoscaling and failure handling

## 13. What You Will Learn Better Than in a Modular Monolith

- where distributed latency appears
- why retries and idempotency matter
- why observability is mandatory
- why shared databases are dangerous
- why async workflows help scale
- why service boundaries are hard to get right

## 14. What to Be Careful About

- too many synchronous cross-service calls in one request
- shared tables across services
- missing correlation IDs
- no dead-letter queues
- no idempotency on event consumers
- putting business logic in the gateway

## 15. Final Build Advice

This project should teach you real microservice architecture, not just service naming.

So your success criteria should be:

- services are independently deployable
- they communicate through clear APIs/events
- failures are observable
- async workflows are reliable
- load tests reveal meaningful scaling behavior

That is the kind of project that will genuinely level up your system design skills.
