# Project Brief

## Purpose

This document captures the long-lived context for this project so future work can continue without repeating the same goals, constraints, and architectural preferences in every session.

When working on this repository, treat this file as the default reference for product direction, architecture, and learning goals unless a newer decision overrides it.

## Project Summary

Build an X-like social media platform with many of X's core features, designed with a strong focus on:

- learning real microservice architecture
- understanding scalability tradeoffs vs modular monoliths
- performing load testing on the system
- building an industry-style backend and platform foundation

The project is not only about shipping features. It is also a deliberate learning project for distributed systems, asynchronous workflows, and large-scale backend design.

## Key Product Goals

- support an X-like social experience
- aim for a path toward high scale, roughly `100k concurrent users`
- include strong notification support
- include media-heavy workflows
- support a mobile app and a full admin/management dashboard

## Preferred Tech Stack

### Backend

- `Node.js` for core services
- `Go` for heavy-lifting workloads such as image/video processing pipelines
- `PostgreSQL` for durable primary data
- `Redis` for caching, rate limiting, ephemeral state, and hot-path acceleration
- `RabbitMQ` is the current preferred event/messaging choice for learning microservices

### Frontend

- `React + Vite` for dashboard/admin/platform management
- `React Native + Expo` for the mobile app

### Notifications

- `MSG91` for SMS, especially OTP
- in development mode, OTP can be logged to the console instead of sending SMS

### Other likely platform components

- `S3-compatible object storage` for media
- `OpenSearch` or `Elasticsearch` for search
- observability stack such as `OpenTelemetry`, `Prometheus`, `Grafana`, and `Sentry`

## Architecture Preference

The current architecture preference is **microservices**, not a modular monolith.

Reason:

- the project is intentionally being used to learn microservice architecture deeply
- the goal is to understand real tradeoffs, not just the benefits
- the user already has some familiarity with modular monolith ideas and wants hands-on distributed-system experience

Important note:

- microservices are being chosen for learning and exploration on purpose
- the system should still be designed with discipline, not as many random tiny services

## Current Recommended Service Landscape

Use domain-sized services rather than overly small services.

Current recommended services:

- `api-gateway`
- `auth-service`
- `user-service`
- `social-graph-service`
- `post-service`
- `timeline-service`
- `notification-service`
- `media-service`
- `search-service`
- `admin-moderation-service`
- `Go media workers`

## Architectural Principles

- each service should have a clear bounded responsibility
- each service should own its own schema/data
- services must not write directly into each other's tables
- synchronous APIs should stay focused and thin
- expensive side effects should move to async workers/events
- observability is required, not optional
- load testing should be part of the architecture learning process

## Concepts Already Discussed

These concepts have already been introduced and should be treated as part of the project's shared vocabulary:

- `API Gateway`
- `queue`
- `event bus`
- `fanout workers`
- `notification workers`
- `search index workers`

Short definitions:

- `API Gateway`: the front door that clients call first
- `queue`: a task pipeline for background work
- `event bus`: the system that carries domain events between services
- `fanout workers`: background workers that distribute posts into follower timelines/caches
- `notification workers`: background workers that deliver SMS, push, email, or in-app notifications
- `search index workers`: background workers that update search indexes when domain data changes

## Timeline Strategy Preference

The current preferred feed strategy is a **hybrid timeline model**:

- fanout-on-write for normal users
- fanout-on-read for very large/celebrity accounts

Reason:

- better read performance for most users
- avoids extreme write amplification for high-follower accounts

## Learning Goals

This project should teach:

- service decomposition
- synchronous vs asynchronous communication
- event-driven design
- retries and idempotency
- eventual consistency
- distributed caching
- failure isolation
- observability in distributed systems
- load testing and bottleneck analysis

## What This Project Should Avoid

- random tiny services with unclear boundaries
- shared-database anti-patterns across services
- putting too much business logic in the API gateway
- skipping tracing/logging/metrics
- building only for theory without testing system behavior under load

## How To Use This File In Future Sessions

When starting future work on this repo, use this file as the baseline for:

- architecture decisions
- service boundary discussions
- infrastructure planning
- implementation sequencing
- scalability reasoning

If a future session changes a major decision, update this file so the repo remains the single source of truth.

## Related Docs

- [System Design](./system-design.md)
- [Implementation Roadmap](./implementation-roadmap.md)

## Current Status

At this stage:

- architecture exploration is active
- microservice-first design is preferred
- implementation has not yet been finalized
- more detailed service contracts, event catalogs, schemas, and delivery plans still need to be defined
