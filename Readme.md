<h1 align="center" style="border-bottom: none">
    <a href="https://github.com/toufiq-austcse/video-touch" target="_blank">
        <img alt="Video Touch" src="./images/logo.png" width="200">
    </a>

</h1>
> Video Touch is a Video Hosting & Streaming platform. In Video Touch users can easily upload, manage and stream videos on demand.

<img src ="images/dashboard.png"/>

## Table Of Contents
- [The Goals of This Project](#goal)
- [Features](#features)
- [Technologies](#technologies---libraries)
- [Backend Architecture](#the-domain-and-bounded-context---service-boundary)
- [How to Run](#how-to-run)
- [Documentation Apis](#documentation-apis)
- [Frontend](#frontend)

<a id="goal"></a>
### The Goals Of This Project
---
*  Implementing video processing with the help of asynchronous job queues (BullMQ + RabbitMQ)
*  Generating video thumbnail
*  Using RabbitMQ as an event-driven message broker
*  Using BullMQ (Redis) for per-worker task queues with retry & backoff
*  Using Event Driven Communications
*  Using GraphQL for client side communications
*  Pluggable storage backend (AWS S3 or Bunny Storage)
*  Stream videos with pluggable CDN (AWS CloudFront, Bunny CDN, or Gotipath CDN)
*  AI-powered transcript generation using Google Gemini or OpenAI
*  Building a simple Dashboard with Next.js and shadcn/ui
*  Using Github Actions for implementing CI
*  Using Docker-Compose for our deployment mechanism.

<a id="features"></a>
### Features
---
* User Login/Registration
* Video Upload (direct upload or import from URL)
* Video Transcoding in several resolutions (1080p, 720p, 540p, 480p, 360p)
* Automatic Thumbnail Generation
* Stream videos on Demand with CDN
* AI-powered Transcript Generation (Google Gemini / OpenAI)
* Pluggable Storage backend (AWS S3 or Bunny Storage)
* Pluggable CDN (AWS CloudFront, Bunny CDN, or Gotipath CDN)
* Webhook notifications

<a id="technologies"></a>
### Technologies
---
* [NestJS](https://nestjs.com/) - A progressive Node.js framework
* [MongoDB](https://www.mongodb.com/) - As Database
* [RabbitMQ](https://www.rabbitmq.com/) - As Job Queue and Event Driven Communications
* [BullMQ](https://docs.bullmq.io/) - As distributed job/worker queue (backed by Redis)
* [GraphQL](https://graphql.org/) - For writing Client Side API's
* [AWS S3](https://aws.amazon.com/s3/) / [Bunny Storage](https://bunny.net/storage/) - As Video Storage (pluggable)
* [AWS CloudFront](https://aws.amazon.com/cloudfront/) / [Bunny CDN](https://bunny.net/cdn/) / [Gotipath CDN](https://gotipath.com/) - As CDN (pluggable)
* [Google Gemini](https://deepmind.google/technologies/gemini/) / [OpenAI](https://openai.com/) - For AI-powered transcript generation
* [Next.js](https://nextjs.org/) - For developing dashboard
* [shadcn/ui](https://ui.shadcn.com/) - UI component library
* [Docker](https://www.docker.com/) - For deployment
* [Github Actions](https://github.com/features/actions) - For CI

<a id="backend-architectire"></a>
### Backend Architecture
---

<img src ="images/video_touch_architecture.png">

<a id="how-to-run"></a>
### How To Run
---

Everything is orchestrated from the **project root** using two compose files:

| File | Purpose |
|---|---|
| `docker-compose.infra.yml` | Infrastructure — MongoDB, Redis, RabbitMQ |
| `docker-compose.yml` | Application — API, Frontend, and all workers |

#### Step 1 — Clone the repository
```bash
git clone git@github.com:vdiotouch/vdiotouch.git
cd vdiotouch
```

#### Step 2 — Configure environment variables
Copy the example env file at the **project root** and fill in the required values:
```bash
cp .env.example .env
```

The `.env` file is organised into the sections below. Required fields are marked with ⚠️.

##### 🔌 Service Ports
| Variable | Default | Description |
|---|---|---|
| `WEB_PORT` | `3000` | Frontend web port (mapped to container port 3000) |
| `API_PORT` | `4000` | Main API port |
| `DOWNLOAD_VIDEO_WORKER_PORT` | `3002` | Download worker port |
| `PROCESS_VIDEO_WORKER_PORT` | `4009` | Process worker port |
| `VALIDATE_VIDEO_WORKER_PORT` | `3004` | Validate worker port |
| `UPLOAD_VIDEO_WORKER_PORT` | `3005` | Upload worker port |
| `AUDIO_WORKER_PORT` | `3007` | Audio worker port |
| `THUMBNAIL_WORKER_PORT` | `3006` | Thumbnail worker port |

##### 📖 Swagger
| Variable | Default | Description |
|---|---|---|
| `SWAGGER_SERVER_BASE_URL` | `http://localhost:4000` | Base URL shown in Swagger UI |
| `SWAGGER_USERNAME` | `vdiotouch` | Basic-auth username for Swagger |
| `SWAGGER_PASSWORD` | `1010` | Basic-auth password for Swagger |

##### 🗄️ Redis
| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` | `redis` | Redis hostname (matches the infra compose service name) |
| `REDIS_PORT` | `6379` | Redis port |

##### 🐇 RabbitMQ
The infra compose starts RabbitMQ with default credentials `admin / admin`. Set `RABBIT_MQ_URL` to match.

| Variable | Default | Description |
|---|---|---|
| `RABBIT_MQ_URL` ⚠️ | — | RabbitMQ connection URL — e.g. `amqp://admin:admin@rabbitmq:5672` |
| `RABBIT_MQ_VIDEO_TOUCH_TOPIC_EXCHANGE` | `video_touch_topic_exchange` | Topic exchange name |
| Other `RABBIT_MQ_*` vars | pre-filled | Queue / routing-key names — safe to keep as-is |

##### ⚙️ Bull Queues
All `BULL_*` variables have pre-filled default queue names and do not need to be changed for a standard setup.

##### ☁️ Storage — choose one provider
Set `STORAGE_PROVIDER` to `s3` (default) or `bunny`.

**AWS S3** (`STORAGE_PROVIDER=s3`)
| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` ⚠️ | AWS access key |
| `AWS_SECRET_ACCESS_KEY` ⚠️ | AWS secret key |
| `AWS_REGION` ⚠️ | S3 bucket region |
| `AWS_S3_BUCKET_NAME` ⚠️ | Target S3 bucket |
| `AWS_PROFILE_NAME` | Optional named AWS profile |

**Bunny Storage** (`STORAGE_PROVIDER=bunny`)
| Variable | Description |
|---|---|
| `BUNNY_STORAGE_ZONE_NAME` ⚠️ | Bunny storage zone name |
| `BUNNY_STORAGE_URL` ⚠️ | Bunny storage endpoint URL |
| `BUNNY_ACCESS_KEY` ⚠️ | Bunny storage access key |

##### 🌐 CDN — choose one provider
Set `CDN_PROVIDER` to `bunny` or `gotipath` (default).

| Variable | Default | Description |
|---|---|---|
| `CDN_PROVIDER` | `gotipath` | Active CDN provider (`bunny` \| `gotipath`) |
| `VIDEO_BASE_URL` ⚠️ | — | Public base URL for video files served through the CDN |

**Bunny CDN** (`CDN_PROVIDER=bunny`)
| Variable | Description |
|---|---|
| `BUNNY_CDN_BASE_URL` ⚠️ | Bunny pull-zone base URL |
| `BUNNY_CDN_API_BASE_URL` | Bunny CDN API base URL |
| `BUNNY_CDN_API_KEY` ⚠️ | Bunny CDN API key |
| `BUNNY_CDN_PULL_ZONE_ID` ⚠️ | Bunny pull zone ID |

**Gotipath CDN** (`CDN_PROVIDER=gotipath`)
| Variable | Description |
|---|---|
| `GOTIPATH_CDN_SECRET` ⚠️ | Gotipath CDN signing secret |
| `GOTIPATH_API_BASE_URL` | Gotipath API base URL |
| `GOTIPATH_API_KEY` ⚠️ | Gotipath API key |
| `GOTIPATH_CDN_DISTRIBUTION_ID` ⚠️ | Gotipath distribution ID |
| `GOTIPATH_CDN_BASE_URL` ⚠️ | Gotipath CDN base URL |

##### 📁 File & Video Settings
| Variable | Default | Description |
|---|---|---|
| `TEMP_UPLOAD_DIRECTORY` | `/uploads` | In-container path for incoming uploads (mounted from `./server/uploads`) |
| `TEMP_VIDEO_DIRECTORY` | `/temp_videos` | In-container path for video processing (mounted from `./server/temp_videos`) |
| `MAX_VIDEO_SIZE_IN_BYTES` | `10737418240` (10 GB) | Maximum allowed video file size |
| `MIN_AVAILABLE_DISK_SPACE_REQUIRED_IN_BYTES` | `5368709120` (5 GB) | Minimum free disk space required |
| `DEFAULT_THUMBNAIL_URL` | — | Fallback thumbnail URL |

##### 🔐 Auth
| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` ⚠️ | `X2tQR8eMCL` | **Change this in production.** JWT signing secret |
| `JWT_EXPIRATION_TIME_IN_SEC` | `3600` | Token lifetime in seconds |

##### 🔁 Job Retry
| Variable | Default | Description |
|---|---|---|
| `RETRY_JOB_ATTEMPT_COUNT` | `3` | Max retry attempts for failed jobs |
| `RETRY_JOB_BACKOFF_IN_MINUTE` | `15` | Backoff delay between retries (minutes) |

##### 🖥️ CPU Pinning
Each process-video worker is pinned to a dedicated CPU core via `cpuset`. These values are **required** by the compose file.

| Variable | Default | Description |
|---|---|---|
| `CPUSET_PROCESS_360P` ⚠️ | `2` | CPU core for 360p worker |
| `CPUSET_PROCESS_480P` ⚠️ | `3` | CPU core for 480p worker |
| `CPUSET_PROCESS_720P` ⚠️ | `0` | CPU core for 720p worker |
| `CPUSET_PROCESS_1080P` ⚠️ | `3` | CPU core for 1080p worker |
| `CPUSET_AUDIO_WORKER` ⚠️ | `1` | CPU core for audio worker |

##### 🤖 Transcription / AI
| Variable | Default | Description |
|---|---|---|
| `TRANSCRIPTION_GENERATION_ENABLED` | `true` | Enable/disable AI transcript generation |
| `AUDIO_CHUNK_DURATION_IN_SEC` | `600` | Duration of each audio chunk sent for transcription |
| `TRANSCRIPT_PROMT_FILE_URL` | — | URL to a custom transcription prompt file |
| `GOOGLE_GENAI_API_KEY` | — | Google Generative AI API key (required if using Gemini) |
| `GOOGLE_GEN_AI_MODEL` | `gemini-2.5-flash` | Google GenAI model to use |
| `GOOGLE_GENAI_TEMPERATURE` | `0.2` | Sampling temperature |
| `GOOGLE_GENAI_THINKING_LEVEL` | `LOW` | Gemini thinking level (`LOW` \| `MEDIUM` \| `HIGH`) |
| `OPENAI_API_KEY` | — | OpenAI API key (required if using OpenAI) |
| `OPENAI_MODEL` | `gpt-4o-audio-preview` | OpenAI model to use |

##### 🌍 Frontend
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_VIDEO_TOUCH_API_URL` | `http://localhost:4000` | URL of the backend API |
| `NEXT_PUBLIC_VIDEO_LIST_PAGE_SIZE` | `10` | Number of videos per page |
| `NEXT_PUBLIC_CDN_DOMAIN` ⚠️ | — | CDN domain used to construct video URLs |
| `NEXT_PUBLIC_UPDATE_DATA_INTERVAL_IN_SECONDS` | `10` | Dashboard polling interval |
| `NEXT_PUBLIC_CDN_PROVIDER` | `cloudfront` | CDN provider hint for the frontend |

#### Step 3 — Start infrastructure *(optional)*
> **Skip this step** if you are using hosted services (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas), [Redis Cloud](https://redis.io/cloud/), [CloudAMQP](https://www.cloudamqp.com/)). Just point the relevant env vars (`REDIS_HOST`, `REDIS_PORT`, `RABBIT_MQ_URL`) to your hosted endpoints instead.

If you want to run infrastructure locally:
```bash
docker compose -f docker-compose.infra.yml up -d
```
This starts **MongoDB** (port `27017`), **Redis** (port `6379`), and **RabbitMQ** (AMQP `5672`, management UI `15672`) with default credentials `admin / admin`.

#### Step 4 — Start the application
```bash
docker compose up -d
```
This starts all application services defined in `docker-compose.yml`:

| Service | Description | Default Port |
|---|---|---|
| `video-touch-web` | Next.js frontend dashboard | `$WEB_PORT` (3000) |
| `video-touch-api` | NestJS GraphQL/REST API | `$API_PORT` (4000) |
| `download-video-worker` | Downloads videos from URLs | — |
| `validate-video-worker` | Validates uploaded video files | — |
| `thumbnail-generation-worker` | Generates video thumbnails | — |
| `process-video-worker-360p` | Transcodes to 360p | — |
| `process-video-worker-480p` | Transcodes to 480p | — |
| `process-video-worker-720p` | Transcodes to 720p | — |
| `process-video-worker-1080p` | Transcodes to 1080p | — |
| `audio-worker` | Extracts audio for transcription | — |
| `upload-video-worker` | Uploads processed files to storage | — |

Once running, open **http://localhost:3000** for the dashboard and **http://localhost:4000** for the API (Swagger available at `/api`).


<a id="frontend"></a>
### Frontend
---
<details>
<summary>Click here to show the screenshots of the project</summary>
    <p> SignUp Page </p>
    <img src ="images/signup.png">
   <p> Login Page </p>
    <img src ="images/login.png">
   <p> Dashboard </p>
    <img src ="images/dashboard.png">
    <p> Video Details Page </p>
    <img src ="images/video_details.png">
    <p> Import Video From Link </p>
    <img src ="images/import_from_link.png">
    <p> Upload Video</p>
    <img src ="images/upload_video.png">
    <p> Edit Video Details </p>
    <img src ="images/edit_video_details.png">


</details>