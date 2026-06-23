# Notification Service Notes

These are my working notes for the notification service so I do not have to keep re-deriving the shape every time I touch it.

Right now the goal is not "build the whole notifications product". The goal is to get the first clean loop working:

- mobile registers an FCM token through `api-gateway`
- `notification-service` listens to RabbitMQ
- a `rabbitmq.ping` event lands in the queue
- `notification-service` turns that into a push
- the phone receives it

That gives us a real vertical slice without baking product-specific logic into the first pass.

## Current shape

I want the notification service to have two entry points:

- synchronous HTTP for things the app needs directly
- asynchronous event consumption for side effects

For now the HTTP side is only doing device installation registration.
That public call should go through the gateway instead of hitting the service directly.
The event side is where the test flow lives.

## What belongs here

`notification-service` should own:

- device installation storage
- notification channel routing
- template rendering
- delivery provider integration
- retries / dead letters later
- in-app notification persistence later

It should not own the original product action.

Examples:

- `social-graph-service` owns "user followed user"
- `post-service` owns "post liked", "reply created"
- `auth-service` owns OTP/login lifecycle
- `notification-service` only reacts to notification-worthy events

## Event shape I want to keep using

This is the shape I want producers to target once the service grows beyond the smoke test:

```ts
{
  eventId: "uuid",
  type: "user.followed",
  actorUserId: "u_123",
  recipientUserId: "u_456",
  entityType: "follow",
  entityId: "follow_789",
  channels: ["in_app", "push"],
  templateKey: "user_followed",
  data: {
    actorHandle: "joy",
    actorDisplayName: "Joy"
  },
  occurredAt: "2026-06-13T10:00:00.000Z"
}
```

For the smoke test I am using the same envelope with:

- `type: "rabbitmq.ping"`
- `templateKey: "rabbitmq_ping"`
- `channels: ["push"]`

That keeps the first test close to the real architecture instead of inventing a throwaway path.

## Current implementation in the repo

Minimal flow that now exists:

- mobile app registers an FCM token instead of an Expo push token
- mobile app sends registration to `api-gateway`
- `api-gateway` forwards it to `notification-service`
- `notification-service` stores that token in `device_installations`
- `notification-service` starts a RabbitMQ consumer on boot
- consumer listens on `notification.events`
- queue bindings default to `rabbitmq.ping,notification.requested`
- `rabbitmq.ping` is rendered into a simple push title/body
- push goes through Firebase Admin and FCM

Important detail:

- for this smoke test, targeting is done with `recipientUserId`
- the mobile app currently sends `EXPO_PUBLIC_NOTIFICATION_TEST_USER_ID` during registration
- later this should come from the authenticated user/session flow, not a test env var

## What is intentionally not built yet

- in-app notifications table
- read/unread APIs
- delivery records
- retries and DLQ handling
- preference checks
- provider fanout beyond FCM

I do not want to mix all of that into the first queue-to-device test.

## Files worth looking at

- `packages/contracts/src/index.ts`
- `apps/notification-service/src/server.ts`
- `apps/notification-service/src/modules/notification-events/`
- `apps/notification-service/src/modules/push/fcm-push.provider.ts`
- `apps/x-clone-app/hooks/use-device-push-token.ts`
- `apps/x-clone-app/lib/device-installations.ts`

## Next steps after the smoke test is green

1. add a real `notifications` table
2. persist an in-app notification record before push delivery
3. add `GET /notifications`
4. add read/unread state
5. add idempotency with processed event IDs
6. add retries + DLQ
7. stop relying on `EXPO_PUBLIC_NOTIFICATION_TEST_USER_ID`
