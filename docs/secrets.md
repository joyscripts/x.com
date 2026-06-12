# Secrets Guide

## Goal

Use one simple rule across the monorepo:

- commit non-sensitive config
- ignore secret values
- ignore secret files
- inject production secrets from a secret manager

This keeps local development practical without teaching the repo bad habits.

## What Goes Where

### Safe To Commit

- ports
- service names
- local hostnames
- feature flags
- public client config
- example env files with placeholder values

### Secret Values

Store secret values in ignored env files such as:

- `/.env.local`
- `/apps/<service>/.env.local`

Examples:

- database passwords
- JWT signing secrets
- API tokens
- S3 credentials
- provider auth keys

### Secret Files

Store file-based secrets in ignored folders such as:

- `/.secrets/<service>/...`
- `/apps/<service>/.secrets/...`

Examples:

- Firebase or Google service config files
- TLS private keys and cert bundles
- Apple auth keys
- Android keystores
- service account JSON files

Pass file locations by environment variable instead of hardcoding real secret files into the repo.

## Development

Recommended local pattern:

1. Keep harmless defaults committed only when they are truly disposable.
2. Put real local secrets in `.env.local` files.
3. Put file-based credentials in `.secrets/`.
4. Reference file secrets with env vars such as `SERVICE_ACCOUNT_PATH` or `EXPO_IOS_GOOGLE_SERVICES_FILE`.

Example layout:

```text
apps/
  auth-service/
    .env.local
  x-clone-app/
    .env.local
    .secrets/
      GoogleService-Info.plist
      google-services.json
.secrets/
  api-gateway/
    jwt-private.key
  media-service/
    service-account.json
```

## Production

Do not depend on committed files or checked-out `.env` files in production.

Use a secret manager or deployment platform injection:

- AWS Secrets Manager or SSM Parameter Store
- GCP Secret Manager
- Azure Key Vault
- HashiCorp Vault
- Kubernetes Secrets mounted as files or env vars

Production rules:

1. each service gets only the secrets it needs
2. never bake secrets into Docker images
3. prefer runtime injection over repo files
4. rotate secrets per environment
5. use short-lived credentials when available

## Mobile App Notes

Client apps must never contain true backend secrets.

For Expo and React Native:

- `EXPO_PUBLIC_*` values are public
- native config files should be treated as environment-specific files
- backend-only credentials belong in backend services, never in the shipped app bundle

The mobile app now supports these env vars:

- `EXPO_IOS_GOOGLE_SERVICES_FILE`
- `EXPO_ANDROID_GOOGLE_SERVICES_FILE`

Recommended local paths:

- `apps/x-clone-app/.secrets/GoogleService-Info.plist`
- `apps/x-clone-app/.secrets/google-services.json`

## Important Cleanup Note

Ignoring a file does not untrack a file that is already committed.

If a secret file has already been committed:

1. rotate the secret if it was real
2. remove it from Git tracking
3. keep the replacement only in ignored local storage or a secret manager
