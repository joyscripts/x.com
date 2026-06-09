# Media Worker (Go)

This service is the initial scaffold for CPU-heavy media processing responsibilities such as:

- image resizing
- thumbnail generation
- video processing orchestration
- metadata extraction

The current template only boots the worker process and logs its startup so the service can grow without mixing media logic into the Node APIs.
