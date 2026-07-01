# X Clone Implementation Guide for Monolith Developers

Last updated: 2026-07-01

This guide is for continuing this repo without feeling lost.

You have worked mostly on monoliths, so the goal of this document is not just "build feature X". The goal is to show how to think through each feature in a microservice codebase:

- which service owns the data
- which service exposes the API
- which events should be emitted
- which consumers should react later
- where tests belong
- when to update contracts and docs

Use this document as the practical build companion to:

- `docs/progress-tracker.md` for current status
- `docs/implementation-roadmap.md` for phase order
- `docs/system-design.md` for architecture design

## 1. The Big Mental Shift

In a monolith, a feature often means:

1. Add a table.
2. Add a model/repository.
3. Add a controller.
4. Call another module directly.
5. Commit.

In this repo, a feature usually means:

1. Decide the owning service.
2. Add or update shared contract schemas only for public/internal boundaries.
3. Add a service-owned table/migration if durable data is needed.
4. Implement repository/service/controller/routes inside the owner service.
5. Expose the feature through `api-gateway` if the mobile/dashboard client needs it.
6. Emit an event if other services need to react.
7. Add or update consumers in downstream services.
8. Add tests at the owner service and gateway boundary.
9. Update docs if the architecture or status changed.

The important rule:

> Do not solve microservice problems by secretly rebuilding a monolith through shared database access or giant shared business packages.

Shared contracts are fine. Shared ownership is not.

## 2. Current Repo Map

The repo already has real slices for:

- auth
- users
- posts
- media
- notifications
- mobile composition/profile flows
- gateway routing
- Go media processing

The repo still needs major feature work in:

- social graph
- timeline/feed
- search
- admin/moderation
- observability
- load testing

Think of the current codebase like this:

```text
client apps
  mobile app
  dashboard

public backend edge
  api-gateway

internal product services
  auth-service
  user-service
  social-graph-service
  post-service
  timeline-service
  notification-service
  media-service
  search-service
  admin-service

async workers
  services/media-worker-go

shared boundary definitions
  packages/contracts
```

## 3. The Golden Rule: One Feature, One Owner

Before implementing anything, ask:

> Which service owns the truth for this feature?

Examples:

| Feature                   | Owner                  | Why                                                 |
| ------------------------- | ---------------------- | --------------------------------------------------- |
| User signs in             | `auth-service`         | Auth lifecycle, OTPs, sessions, token security.     |
| User profile changes      | `user-service`         | Profile is user-owned durable data.                 |
| User follows another user | `social-graph-service` | Follow relationships are graph data.                |
| User creates a post       | `post-service`         | Canonical post body and media refs live here.       |
| Home timeline             | `timeline-service`     | Timeline is a read-optimized feed concern.          |
| Upload media              | `media-service`        | Media metadata and storage lifecycle live here.     |
| Process uploaded media    | `media-worker-go`      | CPU-heavy async processing lives outside Node APIs. |
| Send notification         | `notification-service` | Channel routing and delivery records live here.     |
| Search posts/users        | `search-service`       | Search index/query behavior lives here.             |
| Moderate content          | `admin-service`        | Review/audit workflows live here.                   |

The gateway is not the owner. The gateway is the front door.

## 4. How a Request Should Flow

For a normal client request:

```text
Mobile/Dashboard
  -> api-gateway
  -> owning internal service
  -> service-owned database
```

For an action with side effects:

```text
Mobile/Dashboard
  -> api-gateway
  -> owning internal service
  -> service-owned database
  -> publish event
  -> downstream service consumers react later
```

Example:

```text
User creates a post
  -> mobile calls POST /posts on api-gateway
  -> gateway validates access token
  -> gateway calls post-service
  -> post-service writes post
  -> post-service publishes post.created
  -> timeline-service consumes post.created
  -> search-service consumes post.created
  -> notification-service may consume reply/mention events
```

If you catch yourself wanting `timeline-service` to query the `post_service.posts` table directly, stop. That is the monolith reflex. Use an API, event, or read model instead.

## 5. Local Development Loop

Use this loop for most backend work:

```sh
yarn infra:up
yarn dev:backend
```

Run one service when you want less noise:

```sh
yarn turbo run dev --filter=@x-clone/social-graph-service
yarn turbo run dev --filter=@x-clone/api-gateway
```

Run tests for one package:

```sh
yarn turbo run test --filter=@x-clone/social-graph-service
```

Run type checks for one package:

```sh
yarn turbo run check-types --filter=@x-clone/social-graph-service
```

Run the full backend/client checks before larger commits:

```sh
yarn check-types
yarn test
yarn lint
```

For the Go media worker:

```sh
cd services/media-worker-go
go test ./...
```

## 6. Standard Feature Recipe

Use this recipe whenever you add a new backend feature.

### Step 1: Pick the owner service

Write one sentence:

```text
social-graph-service owns follow relationships because follows are graph data and timeline targeting depends on them.
```

If you cannot write that sentence clearly, the boundary is not clear yet.

### Step 2: Decide if a shared contract is needed

Use `packages/contracts/src/index.ts` for request/response/event shapes that cross service or client boundaries.

Add contracts when:

- gateway validates client payloads
- a service response is consumed by another service
- an event is published to RabbitMQ
- the mobile app imports the type

Avoid adding contracts for:

- private repository row shapes
- private helper inputs
- service-internal implementation details

### Step 3: Add database schema and migration

Most Node services use Drizzle.

Pattern:

```text
apps/<service>/src/db/schema/index.ts
apps/<service>/drizzle/*.sql
apps/<service>/drizzle/meta/*
```

Add the table to the owning service only.

Example ownership:

```text
follows table -> social-graph-service only
timeline_entries table -> timeline-service only
search index metadata -> search-service only
moderation_reports table -> admin-service only
```

### Step 4: Add repository

Repositories should contain DB access and not much product logic.

Pattern:

```text
apps/<service>/src/modules/<domain>/<domain>.repository.ts
```

Good repository methods:

```ts
createFollow(...)
deleteFollow(...)
findFollowers(...)
findFollowing(...)
```

Avoid repository methods like:

```ts
sendFollowNotification(...)
fanoutTimeline(...)
```

Those are service/workflow concerns.

### Step 5: Add service logic

Services contain business rules.

Pattern:

```text
apps/<service>/src/modules/<domain>/<domain>.service.ts
```

Business rules include:

- cannot follow yourself
- cannot attach more than 4 media items
- only post author can delete the post
- duplicate follow should be idempotent

### Step 6: Add controller and routes

Controllers translate HTTP into service calls.

Pattern:

```text
apps/<service>/src/modules/<domain>/<domain>.controller.ts
apps/<service>/src/modules/<domain>/<domain>.routes.ts
apps/<service>/src/modules/<domain>/schemas/<domain>.schema.ts
```

Controllers should:

- parse/validate input
- call the service
- map expected domain errors to HTTP responses
- log unexpected errors

Controllers should not:

- write DB queries directly
- publish events directly unless the service method owns that workflow
- contain feature business rules that belong in the service

### Step 7: Register routes in `app.ts`

Pattern:

```text
apps/<service>/src/app.ts
```

Follow existing services:

- create service dependencies
- register CORS
- register internal auth hook when needed
- register health routes
- register feature routes

### Step 8: Expose through gateway if the client needs it

Gateway pattern:

```text
apps/api-gateway/src/modules/<domain>/<domain>.service.ts
apps/api-gateway/src/modules/<domain>/<domain>.controller.ts
apps/api-gateway/src/modules/<domain>/<domain>.routes.ts
apps/api-gateway/src/modules/<domain>/schemas/<domain>.schema.ts
```

Gateway service calls internal service through `InternalHttpClient`.

Gateway controller usually:

- validates access token
- extracts current user ID
- validates request body/query
- calls internal service
- returns a client-friendly response

### Step 9: Add events if other services need to react

Events are for "something happened" facts.

Good events:

```text
user.followed
post.created
post.deleted
media.uploaded
notification.requested
```

Bad events:

```text
pleaseUpdateTimelineNow
callThisOtherService
doThreeThings
```

Events should describe facts, not commands, unless you intentionally design a command queue.

### Step 10: Add tests

Add tests near the owner:

```text
apps/<service>/tests/<domain>.spec.ts
```

Add gateway tests if the route is public:

```text
apps/api-gateway/tests/<domain>.spec.ts
```

For event consumers, test:

- valid event is handled
- duplicate event is safe
- invalid event is rejected or ignored
- dependency failure does not corrupt durable state

### Step 11: Update docs

Update at least one of:

- `docs/progress-tracker.md` when status changes
- `docs/implementation-roadmap.md` when phase status changes
- `docs/system-design.md` when architecture changes
- this guide if the implementation sequence changes

## 7. Standard Event Recipe

Use this when adding a new RabbitMQ-backed flow.

### Step 1: Define the event contract

Add event shape in `packages/contracts/src/index.ts`.

Every domain event should usually have:

```ts
{
  eventId: string;
  type: string;
  occurredAt: string;
}
```

Then add domain fields.

Example:

```ts
{
  eventId: "uuid",
  type: "post.created",
  postId: "uuid",
  authorId: "uuid",
  createdAt: "iso-date",
  occurredAt: "iso-date"
}
```

### Step 2: Decide the exchange and routing key

Use topic exchanges by event family:

```text
post.events -> post.created
social-graph.events -> user.followed
media.events -> media.uploaded
notification.events -> notification.requested
```

### Step 3: Publish after durable write

The safe order is:

1. Write DB state.
2. Save outbox row in the same transaction if possible.
3. Publish from outbox.
4. Mark outbox row published.

The media service already has an outbox table. Other services should move toward the same pattern.

### Step 4: Consumers must be idempotent

Consumers may receive the same event more than once.

Use one of these:

- unique constraint on `eventId`
- `processed_events` table
- idempotent upsert
- natural uniqueness like `(follower_id, following_id)`

If duplicate delivery would create duplicate rows, the consumer is not safe yet.

### Step 5: Plan retry and DLQ

For each event family, decide:

- max retries
- retry delay
- dead-letter exchange
- dead-letter queue
- what gets logged
- whether the failure should mark local state as failed

The Go media worker is currently the best example in this repo.

## 8. Build Order From Here

This is the recommended order. Do not jump straight into search or admin before graph and timeline exist. Search and admin become more meaningful after the core social loop is working.

```text
1. Social graph MVP
2. Post domain events
3. Timeline MVP
4. Search MVP
5. Notification hardening and product notifications
6. Profile and media polish
7. Admin/moderation MVP
8. Observability baseline
9. Load testing and scaling experiments
```

Each phase below includes:

- goal
- why now
- implementation steps
- files to touch
- acceptance criteria

## 9. Phase 1: Social Graph MVP

### Goal

Users can follow and unfollow other users. Other services can ask who follows whom.

### Why this comes first

Timeline depends on follower relationships. Notifications also need follow events. Without social graph, timeline has no targeting rules.

### Data model

Add tables in `social-graph-service`:

```text
follows
  follower_id
  following_id
  created_at
  unique(follower_id, following_id)

blocks
  blocker_id
  blocked_id
  created_at
  unique(blocker_id, blocked_id)

mutes
  muter_id
  muted_id
  created_at
  unique(muter_id, muted_id)
```

Start with `follows` if you want the smallest useful slice. Add blocks/mutes after follow works.

### Internal service endpoints

In `social-graph-service`:

```text
POST /relationships/follow
DELETE /relationships/follow/:targetUserId
GET /relationships/followers?userId=&cursor=&limit=
GET /relationships/following?userId=&cursor=&limit=
GET /relationships/status?viewerId=&targetUserId=
```

Suggested request bodies:

```json
{
  "followerId": "uuid",
  "followingId": "uuid"
}
```

### Gateway endpoints

In `api-gateway`:

```text
POST /users/:id/follow
DELETE /users/:id/follow
GET /users/:id/followers
GET /users/:id/following
GET /users/:id/relationship
```

Gateway uses access token user ID as the actor. Do not trust a client-sent `followerId`.

### Contracts

Add to `packages/contracts/src/index.ts`:

```text
followUserRequestSchema
followUserResponseSchema
unfollowUserResponseSchema
listFollowersResponseSchema
listFollowingResponseSchema
relationshipStatusResponseSchema
userFollowedEventSchema
userUnfollowedEventSchema
```

### Business rules

Implement in `social-graph-service` service layer:

- user cannot follow themself
- following twice should return success without duplicate rows
- unfollowing a non-followed user should be safe
- blocked users cannot follow each other once blocking is implemented
- pagination must be stable

### Events

Publish:

```text
user.followed
user.unfollowed
```

Suggested event fields:

```json
{
  "eventId": "uuid",
  "type": "user.followed",
  "followerId": "uuid",
  "followingId": "uuid",
  "occurredAt": "iso-date"
}
```

### Notification integration

After `user.followed`, produce or translate into a notification event:

```json
{
  "type": "user.followed",
  "actorUserId": "follower",
  "recipientUserId": "following",
  "entityType": "follow",
  "channels": ["in_app", "push"],
  "templateKey": "user_followed"
}
```

The notification service already has a `user.followed` definition, so this is a good first real product notification.

### Files to touch

```text
packages/contracts/src/index.ts
apps/social-graph-service/src/db/schema/index.ts
apps/social-graph-service/src/modules/relationships/
apps/social-graph-service/src/app.ts
apps/social-graph-service/tests/
apps/api-gateway/src/modules/social-graph/
apps/api-gateway/src/app.ts
apps/api-gateway/src/config/env.ts
apps/api-gateway/tests/
docs/progress-tracker.md
```

### Tests

Social graph service tests:

- requires internal secret
- follows a user
- does not duplicate follow
- rejects self-follow
- unfollows a user
- lists followers
- lists following

Gateway tests:

- rejects missing bearer token
- follows as current user
- unfollows as current user
- lists followers/following

### Acceptance criteria

- Mobile or API client can follow another user through gateway.
- Follow row exists only in social graph DB.
- Duplicate follow does not create duplicate rows.
- `user.followed` event can be published or at least saved to outbox.
- Notification path can consume a follow notification event.

## 10. Phase 2: Post Domain Events

### Goal

Post-service emits events when posts are created or deleted.

### Why this comes after graph

Timeline and search need post events. Notifications eventually need reply/mention events. This phase makes post-service useful beyond direct API reads.

### Events to add

Start with:

```text
post.created
post.deleted
```

Later:

```text
post.replied
post.liked
post.reposted
post.quoted
post.updated
```

### Contract example

```json
{
  "eventId": "uuid",
  "type": "post.created",
  "postId": "uuid",
  "authorId": "uuid",
  "replyToPostId": "uuid-or-null",
  "repostOfPostId": "uuid-or-null",
  "mediaIds": ["uuid"],
  "createdAt": "iso-date",
  "occurredAt": "iso-date"
}
```

### Implementation approach

Add a post outbox table:

```text
post_event_outbox
  id
  event_type
  payload
  status
  attempts
  last_error
  published_at
  created_at
  updated_at
```

Follow the media service pattern.

On `create post`:

1. Insert post.
2. Insert post media rows.
3. Insert `post.created` outbox row.
4. Commit.
5. Dispatcher publishes to RabbitMQ.

On delete:

1. Soft delete post.
2. Insert `post.deleted` outbox row.
3. Commit.
4. Dispatcher publishes to RabbitMQ.

### Files to touch

```text
packages/contracts/src/index.ts
apps/post-service/src/db/schema/index.ts
apps/post-service/src/modules/posts/posts.repository.ts
apps/post-service/src/modules/posts/posts.service.ts
apps/post-service/src/modules/posts/post-events.publisher.ts
apps/post-service/src/server.ts
apps/post-service/tests/posts.spec.ts
```

### Acceptance criteria

- Creating a post persists an outbox row.
- Deleting a post persists an outbox row.
- Outbox rows publish to RabbitMQ.
- Duplicate publisher runs do not lose events.
- Tests cover both post state and event creation.

## 11. Phase 3: Timeline MVP

### Goal

Users can open a home feed that shows posts from themselves and people they follow.

### Keep the first version simple

Do not build ranking, celebrity fanout, and machine-learning recommendations first.

Build this:

```text
GET /timeline/home
```

It returns reverse-chronological posts from:

- current user
- followed users

### Ownership

Timeline service owns timeline entries or timeline cache. It does not own the canonical post body.

Post service owns post content.

### Recommended first implementation

Use a simple Redis sorted set per user:

```text
timeline:home:<userId>
  score = post created timestamp
  value = postId
```

When `post.created` arrives:

1. Timeline service asks social graph service for followers of author.
2. Add post ID to each follower timeline.
3. Add post ID to author's own timeline.

When `GET /timeline/home` is called:

1. Read post IDs from Redis sorted set.
2. Hydrate posts from post-service by IDs.
3. Return posts with cursor.

### Internal endpoints

In `timeline-service`:

```text
GET /timeline/home?userId=&cursor=&limit=
```

In `api-gateway`:

```text
GET /timeline/home
```

Gateway injects current user ID from access token.

### Consumer

Timeline service consumes:

```text
post.created
post.deleted
user.followed
user.unfollowed
```

Start with only `post.created`.

Later:

- on `post.deleted`, remove or hide timeline references
- on `user.followed`, optionally backfill recent posts
- on `user.unfollowed`, remove or filter that author's posts

### Contracts

Add:

```text
homeTimelineRequestSchema
homeTimelineResponseSchema
timelineItemSchema
```

### Files to touch

```text
packages/contracts/src/index.ts
apps/timeline-service/src/modules/timeline/
apps/timeline-service/src/modules/post-events/
apps/timeline-service/src/config/env.ts
apps/timeline-service/src/server.ts
apps/timeline-service/tests/
apps/api-gateway/src/modules/timeline/
apps/api-gateway/src/app.ts
apps/x-clone-app/app/(tabs)/index.tsx
apps/x-clone-app/lib/timeline.ts
```

### Tests

Timeline service:

- consumes `post.created`
- writes post ID to follower timelines
- returns paginated post IDs/posts
- ignores duplicate event

Gateway:

- rejects unauthenticated timeline request
- injects current user ID
- returns timeline response

Mobile:

- replace global post list with home timeline call
- show loading/error/empty states

### Acceptance criteria

- Follow user A.
- User A creates a post.
- User B opens home timeline.
- User B sees user A's post.
- Deleting the post eventually hides it or returns it as deleted based on chosen behavior.

## 12. Phase 4: Search MVP

### Goal

Users can search for posts and users.

### Why after timeline

Search is more useful after users and posts emit events. You want search-service to build its own index from events, not scrape other databases.

### First version

Index:

- users by handle/display name
- posts by content

Expose:

```text
GET /search?q=&type=top|users|posts&cursor=&limit=
```

### Event consumers

Search service consumes:

```text
user.created
user.profile.updated
post.created
post.deleted
```

### OpenSearch indexes

Suggested indexes:

```text
users
posts
```

User document:

```json
{
  "userId": "uuid",
  "handle": "joy",
  "displayName": "Joy",
  "bio": "text",
  "updatedAt": "iso-date"
}
```

Post document:

```json
{
  "postId": "uuid",
  "authorId": "uuid",
  "content": "text",
  "createdAt": "iso-date",
  "deletedAt": null
}
```

### Files to touch

```text
apps/search-service/src/modules/search/
apps/search-service/src/modules/indexing/
apps/search-service/src/config/env.ts
apps/search-service/src/server.ts
apps/api-gateway/src/modules/search/
apps/x-clone-app/app/(tabs)/searches.tsx
apps/x-clone-app/lib/search.ts
```

### Acceptance criteria

- Updating profile eventually updates user search.
- Creating a post eventually makes it searchable.
- Deleting a post removes or hides it from search.
- Search-service is the only service that talks directly to OpenSearch.

## 13. Phase 5: Notification Hardening

### Goal

Notifications become reliable enough for real product flows.

### Current state

Notification service already has:

- device installation registration
- in-app notifications
- read API
- delivery records
- FCM push provider
- log SMS/email providers
- RabbitMQ consumer

### Remaining work

Add:

- processed event idempotency table
- retry/DLQ handling
- user notification preferences
- authenticated user targeting
- product producers for follow/reply/like/mention events

### Suggested tables

```text
processed_notification_events
  event_id
  processed_at

notification_preferences
  user_id
  type
  channel
  enabled
  updated_at
```

### Product notifications to add first

1. `user.followed`
2. `post.replied`
3. `post.liked`
4. `post.mentioned`

### Acceptance criteria

- Duplicate event does not duplicate in-app notification.
- Failed provider delivery records failure.
- Retryable failures go to retry queue.
- Exhausted failures go to DLQ.
- User can disable at least one notification channel/type.

## 14. Phase 6: Profile and Media Polish

### Goal

Make user-facing profile and media flows feel like a real app, not backend demos.

### Profile work

Add:

- public profile screen
- profile post list
- follower/following counts
- follow button
- avatar upload
- profile edit screen

### Media work

Add:

- direct upload or presigned upload flow
- upload progress
- processing states
- retry failed upload
- display processed variants when available

### Mobile files to expect

```text
apps/x-clone-app/app/profile/
apps/x-clone-app/components/profile/
apps/x-clone-app/components/posts/
apps/x-clone-app/lib/users.ts
apps/x-clone-app/lib/media.ts
apps/x-clone-app/lib/posts.ts
```

### Acceptance criteria

- User can view another user's profile.
- User can follow/unfollow from profile.
- User can upload/change avatar.
- Media posts show useful loading/processing/failure states.

## 15. Phase 7: Admin and Moderation MVP

### Goal

Build a small control plane for safety and operations.

### First admin features

Start with:

```text
POST /reports
GET /admin/reports
POST /admin/reports/:id/resolve
POST /admin/posts/:id/hide
POST /admin/users/:id/suspend
```

### Ownership

Admin service owns:

- reports
- review queues
- moderation actions
- audit logs

Post service owns:

- canonical post visibility state

User service owns:

- canonical user account/profile state

Admin service should request changes through service APIs or publish moderation events. Do not let admin service directly update post-service or user-service tables.

### Dashboard work

Replace placeholder dashboard cards with:

- report queue
- report detail
- action buttons
- audit log table
- service health overview

### Acceptance criteria

- User can report a post.
- Admin can see report.
- Admin can hide post through a controlled workflow.
- Every admin action creates an audit log.

## 16. Phase 8: Observability Baseline

### Goal

Make debugging microservices possible before load testing.

### Add these first

1. Request ID at gateway.
2. Propagate request ID to internal service calls.
3. Include request ID in logs.
4. Include correlation ID in RabbitMQ messages.
5. Add basic metrics endpoints or metrics exporter.

### Why this matters

In a monolith, one stack trace often tells the story.

In microservices, a user action may cross:

```text
gateway -> post-service -> RabbitMQ -> timeline-service -> Redis
```

Without correlation IDs, you will feel blind.

### Acceptance criteria

- One user request can be traced across gateway and internal service logs.
- One event can be traced from producer to consumer.
- RabbitMQ queue depth is visible.
- Service latency is visible.

## 17. Phase 9: Load Testing

### Goal

Learn where the architecture bends.

### Test in this order

1. Auth OTP storm.
2. Post creation burst.
3. Timeline read pressure.
4. Follow graph fanout.
5. Celebrity post fanout.
6. Notification burst.
7. Media upload and processing burst.

### Tooling

Use either:

```text
k6
Locust
```

Create a folder:

```text
tests/load/
```

Suggested files:

```text
tests/load/auth-otp-storm.js
tests/load/post-create-burst.js
tests/load/timeline-read-pressure.js
tests/load/celebrity-post.js
tests/load/media-upload-burst.js
```

### Metrics to record

- p50/p95/p99 latency
- error rate
- DB CPU
- slow queries
- Redis hit rate
- queue depth
- event lag
- worker throughput
- memory/CPU per service

### Acceptance criteria

- You can run one repeatable load test.
- You can describe the first bottleneck with evidence.
- You can make one scaling/design change and rerun the test.

## 18. How to Avoid Getting Lost

When you open the repo, do this:

1. Read `docs/progress-tracker.md`.
2. Pick one phase from this guide.
3. Pick one vertical slice inside that phase.
4. Write down the owning service.
5. Write down the gateway endpoint if needed.
6. Write down the event if needed.
7. Add tests before expanding UI.
8. Update progress docs when the slice is done.

Do not work on five services at once unless the feature forces it.

Good slice:

```text
Implement follow/unfollow through social-graph-service and api-gateway.
```

Too broad:

```text
Build social graph, timeline, notifications, profile page, and dashboard.
```

Microservices reward small vertical slices.

## 19. How to Read One Service

Most Node services follow this shape:

```text
src/app.ts
src/server.ts
src/config/env.ts
src/db/client.ts
src/db/schema/index.ts
src/modules/health/
src/modules/<domain>/
tests/
```

Read in this order:

1. `src/app.ts`: what routes and dependencies exist?
2. `src/server.ts`: what real infrastructure starts on boot?
3. `src/config/env.ts`: what env vars does it need?
4. `src/db/schema/index.ts`: what data does it own?
5. `src/modules/<domain>/*.routes.ts`: what endpoints exist?
6. `src/modules/<domain>/*.controller.ts`: how HTTP maps to service calls?
7. `src/modules/<domain>/*.service.ts`: what business rules exist?
8. `src/modules/<domain>/*.repository.ts`: what DB queries exist?
9. `tests/*.spec.ts`: what behavior is expected?

This reading order keeps you oriented.

## 20. Common Microservice Mistakes to Watch For

### Mistake 1: Gateway becomes the monolith

Bad:

```text
api-gateway calculates follow counts, writes graph data, sends notifications.
```

Good:

```text
api-gateway authenticates, validates, forwards to social-graph-service.
```

### Mistake 2: Services share databases

Bad:

```text
timeline-service queries post_service.posts directly.
```

Good:

```text
timeline-service stores post IDs and hydrates through post-service or a read model.
```

### Mistake 3: Events are not idempotent

Bad:

```text
Every duplicate post.created inserts duplicate timeline rows.
```

Good:

```text
Timeline insert uses eventId uniqueness or idempotent sorted-set writes.
```

### Mistake 4: Everything is synchronous

Bad:

```text
POST /posts waits for timeline fanout, search indexing, and notifications.
```

Good:

```text
POST /posts writes the post and publishes post.created. Side effects happen async.
```

### Mistake 5: No visibility

Bad:

```text
Something failed somewhere in RabbitMQ.
```

Good:

```text
Event eventId=... failed in timeline-service after 3 retries and is in DLQ.
```

## 21. Recommended First Task After Reading This

Build the social graph MVP in this order:

1. Add follow contracts.
2. Add `follows` table in social-graph-service.
3. Add repository/service/controller/routes.
4. Add service tests.
5. Add gateway social graph module.
6. Add gateway tests.
7. Add `user.followed` event contract.
8. Add event publishing or outbox.
9. Wire notification event path.
10. Update `progress-tracker.md`.

Do not start timeline until this slice works.

## 22. Done Definition for Each Phase

For any phase to be considered done:

- service-owned data is in the correct service
- gateway exposes only the needed public API
- contracts are updated
- tests cover success and important failure paths
- events are documented and idempotent or explicitly marked as not hardened yet
- docs are updated
- mobile/dashboard has at least a basic usable path if the feature is user-facing

If a phase has only a service package and health check, call it scaffold. If it has one usable vertical slice but missing hardening, call it partial. If it is usable with tests and reliable side effects, call it done.
