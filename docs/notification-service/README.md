# Notification Service Notes

These are my working notes for the notification service so I do not have to keep re-deriving the shape every time I touch it.

The first queue-to-device loop has grown into a small notification platform slice:

- mobile registers an FCM token through `api-gateway`
- `notification-service` listens to RabbitMQ
- notification events land in the queue
- `notification-service` resolves a notification definition
- the service fans out to in-app, push, SMS-log, or email-log channels
- delivery attempts are recorded

`rabbitmq.ping` still exists as a smoke-test event, but the service also handles real notification-style envelopes such as `auth.otp.requested` and `user.followed`.

## Current shape

I want the notification service to have two entry points:

- synchronous HTTP for things the app needs directly
- asynchronous event consumption for side effects

The HTTP side currently supports device installation registration, in-app notification listing, and marking in-app notifications read. Public calls should go through the gateway instead of hitting the service directly.

The event side consumes RabbitMQ notification events and routes them through channel handlers.

## What belongs here

`notification-service` should own:

- device installation storage
- notification channel routing
- template rendering
- delivery provider integration
- delivery records
- in-app notification persistence
- retries / dead letters later

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
- queue bindings default to `rabbitmq.ping,notification.requested,auth.otp.requested`
- events are resolved through notification definitions
- in-app notifications are stored when the event requests `in_app`
- delivery attempts are stored in `notification_deliveries`
- push goes through Firebase Admin and FCM when the event requests `push`
- SMS and email currently use log providers

Important detail:

- for this smoke test, targeting is done with `recipientUserId`
- the mobile app currently sends `EXPO_PUBLIC_NOTIFICATION_TEST_USER_ID` during registration
- later this should come from the authenticated user/session flow, not a test env var

## What is intentionally not built yet

- notification preferences
- retries and DLQ handling for notification events
- explicit processed-event ledger beyond current uniqueness constraints
- preference checks
- real SMS/email providers

The next step is to make the notification event consumer as reliable as the media worker path.

## Files worth looking at

- `packages/contracts/src/notifications.ts`
- `apps/notification-service/src/server.ts`
- `apps/notification-service/src/modules/notification-events/`
- `apps/notification-service/src/modules/notification-channels/push/fcm-push.provider.ts`
- `apps/x-clone-app/hooks/use-device-push-token.ts`
- `apps/x-clone-app/lib/device-installations.ts`

## Next steps after the smoke test is green

1. add idempotency with processed event IDs
2. add retries + DLQ
3. add notification preferences
4. wire real product producers for follow/reply/like flows
5. stop relying on `EXPO_PUBLIC_NOTIFICATION_TEST_USER_ID`
