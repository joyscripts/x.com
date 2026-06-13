# RabbitMQ Ping Smoke Test

This is the smallest end-to-end test I want working before I pile on real notification features.

If this works, I know:

- the app can register a push token
- the notification service can look up the right device
- RabbitMQ wiring is good
- the service can consume an event and send a push

## What this test covers

Flow:

1. mobile app gets an Expo push token
2. mobile app calls `POST /notifications/device-installations` on the API gateway
3. API gateway forwards the request to notification-service
4. notification service stores the token under a test user id
5. I publish `rabbitmq.ping` to RabbitMQ
6. notification service consumes the event
7. notification service sends a push through Expo
8. device receives the notification

## Before doing anything

The current setup is aimed at Expo Push, not direct FCM/APNs.

That means:

- the app needs an `ExpoPushToken`
- the device needs to be able to receive push notifications
- the notification service sends to Expo Push API

Practical note:

- a physical device is the safest path
- Android emulator with Google Play services can work too
- iOS simulator support depends on your local Apple/Xcode setup, so I would not use it for the first pass unless you already know it works on your machine

## One-time setup

### 1. Start infra

From the repo root:

```sh
yarn infra:up
```

That gives us Postgres and RabbitMQ locally.

### 2. Make sure the notification table exists

From the repo root:

```sh
yarn workspace @x-clone/notification-service db:push
```

Right now this service only needs the `device_installations` table for the smoke test.

### 3. Mobile env vars

Set these before running the Expo app:

```sh
EXPO_PUBLIC_API_GATEWAY_URL=http://YOUR_LAN_IP:4000
EXPO_PUBLIC_NOTIFICATION_TEST_USER_ID=test-user
EXPO_PUBLIC_APP_VARIANT=development
```

Notes:

- use your machine's LAN IP, not `localhost`, when the app runs on a real device
- `EXPO_PUBLIC_NOTIFICATION_TEST_USER_ID` is temporary and only exists to make the smoke test targetable

### 4. Push credentials

For Android, the app config already expects:

```sh
EXPO_ANDROID_GOOGLE_SERVICES_FILE=/absolute/path/to/google-services.json
```

If you are using iOS too, make sure your push credentials are configured in the Expo/EAS side before expecting a real remote push to arrive.

I would start with Android first unless iOS credentials are already sorted.

### 5. Build a dev client

This repo is using `expo-notifications`, so I would test this in a dev build instead of assuming Expo Go will behave the same as a real notifications setup.

From `apps/x-clone-app`:

```sh
yarn android
```

or

```sh
yarn ios
```

If you already use EAS dev builds, stick with that path. The important part is: test on something that supports remote notifications properly.

## Run the services

### 1. Start notification-service

From the repo root:

```sh
yarn workspace @x-clone/notification-service dev
```

What I expect in logs:

- Fastify starts on `4006`
- RabbitMQ consumer starts
- queue binds to `rabbitmq.ping` and `notification.requested`

### 2. Start api-gateway

From the repo root:

```sh
yarn workspace @x-clone/api-gateway dev
```

What I expect in logs:

- Fastify starts on `4000`
- `POST /notifications/device-installations` is available

### 3. Start the mobile app

From `apps/x-clone-app`:

```sh
yarn start
```

Then open the dev build on the device/emulator.

On first launch:

- accept notification permission
- wait for the app to register the Expo push token

If registration worked, the notification service should have a `device_installations` row for:

- `userId = test-user`
- `pushProvider = expo`

## Publish the test event

From the repo root:

```sh
TEST_NOTIFICATION_RECIPIENT_USER_ID=test-user yarn workspace @x-clone/notification-service publish:ping
```

What that script publishes:

```ts
{
  eventId: "generated uuid",
  type: "rabbitmq.ping",
  actorUserId: "system",
  recipientUserId: "test-user",
  entityType: "system",
  entityId: "same as eventId",
  channels: ["push"],
  templateKey: "rabbitmq_ping",
  data: {
    message: "rabbitmq.ping made it through notification-service"
  },
  occurredAt: "current ISO time"
}
```

Routing details:

- exchange: `notification.events`
- routing key: `rabbitmq.ping`

## What success looks like

In notification-service logs:

- the publish script prints the event id
- the consumer logs `Notification event handled`
- the result should show at least one matched installation

On the device:

- you get a push titled `RabbitMQ ping`
- body says `rabbitmq.ping made it through notification-service`

## If it does not work

### Case 1: no device registration row

Check:

- `EXPO_PUBLIC_API_GATEWAY_URL`
- the app and service can reach each other on the network
- notification permission was granted
- the app actually produced an Expo push token

### Case 2: event is published but nothing is consumed

Check:

- RabbitMQ container is up
- service log says the consumer started
- exchange name is `notification.events`
- queue binding includes `rabbitmq.ping`

Useful local UI:

- RabbitMQ management UI: `http://localhost:15672`
- default local login: `guest / guest`

### Case 3: event is consumed but no push goes out

Check:

- the stored installation row uses `pushProvider = expo`
- the `recipientUserId` on the event matches the stored `userId`
- the stored token looks like `ExponentPushToken[...]` or `ExpoPushToken[...]`

### Case 4: Expo rejects the push

This usually means one of these:

- token is stale
- app credentials are not set up correctly yet
- the build on device does not match the push setup

In that case I would re-register the app, confirm the token changed, and try the ping again.

## What I would do right after this works

1. persist a notification row before sending push
2. add a read API for the app inbox
3. add idempotency on consumed events
4. add a retry / DLQ story
5. switch from test-user env wiring to real authenticated user ids
