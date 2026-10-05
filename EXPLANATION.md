# PulseWatch: Full-Stack Project Technical Guide and Architecture

This document provides a comprehensive technical explanation of how the PulseWatch application was designed and constructed across both the backend and frontend. It covers architecture, design patterns, core JavaScript concepts, and a complete breakdown of all dependencies.

---

## 1. System Overview and Architecture

PulseWatch is a website health and uptime monitoring system. It allows users to create accounts, register website URLs, and monitor their status in real time. 

### Architectural Flow
1. Client Interaction: The user interacts with a Next.js frontend running in the browser.
2. API Layer: The frontend sends HTTP requests to an Express.js backend running on Node.js.
3. Persistence: User records, monitor targets, and historical ping logs are stored in a PostgreSQL database managed via Sequelize ORM.
4. Distributed Background Tasks: A dedicated BullMQ background worker continuously checks registered endpoints at regular intervals.
5. In-Memory Caching: Fast retrieval of dashboard metrics and active monitors is handled via Redis.
6. Decoupled Processing: The HTTP request-response cycle is strictly decoupled from the website pinging process. When an endpoint is slow to respond, it never blocks user requests.

---

## 2. How the Backend Was Built

The backend is built with Node.js and Express using native ES Modules. It resides entirely in the `backend/` folder and follows a flat, accessible structure designed for clarity.

### Database Layer (`backend/src/db.js`)
- Uses Sequelize to establish a connection to PostgreSQL.
- Consolidates all three relational models in a single location:
  - User: Stores id, name, unique email, and hashed password.
  - Monitor: Stores id, userId, name, url, current status (UP, DOWN, PENDING), last response time, and active flag.
  - Heartbeat: Stores id, monitorId, status, response time in milliseconds, and timestamp.
- Defines associations: User has many Monitors; Monitor has many Heartbeats. Cascade deletion ensures that removing a monitor removes all associated heartbeat records.
- Automatically handles database synchronization on server startup via `sequelize.sync({ alter: true })`.

### In-Memory Cache (`backend/src/redis.js`)
- Initializes a single `ioredis` client instance.
- This client is shared between the HTTP caching mechanism and the BullMQ job queue to eliminate redundant connection configurations.

### Asynchronous Queue and Worker (`backend/src/queue.js`)
- Employs BullMQ backed by Redis.
- Exposes `schedulePing(monitor)`: Uses BullMQ JobScheduler to schedule a recurring job every 60 seconds without relying on memory-bound `setInterval`.
- Exposes `removePing(monitorId)`: Cleans up scheduled jobs when a monitor is paused or deleted.
- Instantiates a background `Worker`:
  - Receives the target URL and monitor ID.
  - Executes an HTTP GET request using Axios with an enforced 5-second timeout.
  - Calculates response duration (latency) in milliseconds.
  - Writes a new row to the Heartbeat table.
  - Updates the Monitor row with latest status and response time.
  - Invalidates the user's cached monitor list in Redis.

### Authentication Middleware (`backend/src/auth.js`)
- Extracts the HTTP `Authorization` header (`Bearer <token>`).
- Verifies the JSON Web Token (JWT) against the server secret key.
- Populates `req.user` with the decoded payload before handing off control to protected route handlers.

### Routing Layer (`backend/src/routes/`)
- `auth.js`: Implements user registration and login. Validates incoming request payloads directly using Zod schemas. Hashes passwords using bcrypt with 10 salt rounds and signs JWT tokens valid for 7 days.
- `monitors.js`:
  - `GET /`: Implements read-through caching. Checks Redis memory first. On a cache miss, queries PostgreSQL, stores the result in Redis with a 30-second time-to-live (TTL), and responds.
  - `POST /`: Validates the URL and name using Zod, inserts into PostgreSQL, invalidates the user's Redis cache, and registers a repeating BullMQ job.
  - `PATCH /:id/toggle`: Toggles active status and pauses or resumes the BullMQ schedule accordingly.
  - `DELETE /:id`: Removes the queue schedule, drops the monitor from PostgreSQL, and purges the Redis cache.
  - `GET /:id/heartbeats`: Returns historical ping logs to render chronological latency reports.

### Server Lifecycle (`backend/src/app.js`)
- Configures CORS and JSON parsing middlewares.
- Attaches Morgan request logging using the `dev` profile.
- Defines a `/health` route.
- Mounts `/api/auth` and `/api/monitors`.
- Implements a catch-all 404 handler for unknown routes.
- Implements a global error handling middleware to prevent unhandled process crashes.
- Tests database connectivity, performs schema synchronization, and listens on port 5000.

---

## 3. How the Frontend Was Built

The frontend is built using Next.js (App Router) and React. It resides in the `frontend/` folder and interfaces with the backend through REST API calls.

### API Communication (`frontend/lib/api.js`)
- Implements a centralized client around the browser's native `fetch` API.
- Reads and persists authentication tokens in browser `localStorage`.
- Automatically attaches the `Authorization: Bearer <token>` header to all outgoing authenticated requests.
- Maps one-to-one with the backend API endpoints.

### Styling Architecture (`frontend/app/globals.css`)
- Styled using 100% Vanilla CSS without external CSS libraries or frameworks.
- Uses Flexbox (`display: flex`, `flex-wrap: wrap`, `gap`) exclusively. Complex grid layouts were intentionally avoided for maximum clarity.
- Defines CSS variables for consistent theming: dark slate background (`#0b0f19`), card surfaces (`#151d30`), active borders, and distinct status color indicators.
- Includes responsive media queries ensuring cards and navigation bars adapt smoothly to mobile viewports.

### Application Pages
- `app/layout.js`: The root layout injecting font declarations, global metadata, and base styling.
- `app/page.js`: The public landing page. Features a welcome hero, key system highlights, and action buttons. If an existing token is detected in `localStorage`, the user is redirected directly to the dashboard.
- `app/login/page.js` and `app/register/page.js`: Controlled form pages managing user input through standard React state. They handle loading states, display inline validation errors from the backend, save credentials to `localStorage`, and transition to `/dashboard`.
- `app/dashboard/page.js`:
  - Reads active monitor data and displays live aggregated statistics (Total Monitors, Online Count, Offline Count, Average Latency).
  - Displays a cache indicator showing whether data was retrieved from Redis or PostgreSQL.
  - Features an inline monitor creation form.
  - Lists individual monitor cards with live status badges (UP, DOWN, PENDING), response time metrics, external link access, and controls to Pause, Resume, or Delete.
  - Features a modal overlay to view the latest heartbeat history records for any selected monitor.

---

## 4. JavaScript and Computer Science Concepts Used

### Asynchronous Programming (Promises and Async/Await)
- Web requests, database operations, Redis cache lookups, and background pings are inherently asynchronous operations.
- The project relies on `async/await` syntax built upon native JavaScript Promises to write clean, linear code while non-blocking I/O executes concurrently.

### The Event Loop and Decoupled Processing
- Node.js operates on a single-threaded event loop.
- Long-running network tasks (such as checking 50 external websites) must never run synchronously inside an Express HTTP handler.
- By placing ping routines inside a BullMQ worker backed by Redis, the HTTP server remains entirely unblocked and responsive to user requests.

### In-Memory Caching vs. Disk-Based Relational Storage
- PostgreSQL stores data durably on disk, which involves physical I/O overhead.
- Redis keeps key-value pairs entirely in RAM, offering sub-millisecond retrieval times.
- The project teaches the "Read-Through Cache" pattern:
  1. Check Redis memory for existing data.
  2. If present (Cache Hit), return immediately.
  3. If missing (Cache Miss), query PostgreSQL, store a copy in Redis with an expiration window (TTL), and return.
  4. On any database write, update, or delete, invalidate the corresponding cache key to prevent stale reads.

### Closures and Middleware Chains
- Express routes process requests sequentially through functions known as middleware.
- Middleware functions access the request (`req`), response (`res`), and next execution step (`next()`).
- Closures allow middlewares like `auth.js` to inspect authorization headers, decode tokens, and mutate the `req` object for subsequent handlers.

### Data Modeling and Referential Integrity
- Models map JavaScript objects directly to SQL tables via Sequelize.
- Foreign key constraints maintain relational integrity between the `users`, `monitors`, and `heartbeats` tables.
- Cascade rules ensure database hygiene when parents are deleted.

### Array Transformation Methods
- The frontend computes aggregated metrics on the fly using functional JavaScript array methods:
  - `.filter()` to isolate monitors by status (UP or DOWN).
  - `.reduce()` to compute total response times for calculating averages.
  - `.map()` to render JSX card lists from state arrays.

### ES Modules (ESM)
- Standardized `import` and `export` statements are used across both frontend and backend instead of legacy CommonJS `require()`.
- Provides explicit dependency graphs and aligns the codebase with modern ECMAScript standards.

---

## 5. Dependencies and Libraries Breakdown

### Backend Dependencies

| Package | Purpose | Why It Was Chosen |
|---|---|---|
| `express` | Web application framework | Minimalist, unopinionated routing engine for handling REST API requests. |
| `sequelize` | Object-Relational Mapper (ORM) | Simplifies SQL operations, handles connection pools, and synchronizes schema definitions. |
| `pg` and `pg-hstore` | PostgreSQL client driver | Underlying database communication protocol used by Sequelize to talk to PostgreSQL. |
| `ioredis` | Redis client | Robust Redis client providing native support for BullMQ and clean key-value operations. |
| `bullmq` | Distributed task scheduler and queue | Manages repeating cron-style jobs, retry mechanisms, and background worker threads. |
| `zod` | Schema declaration and validation | Validates incoming payloads (such as URLs and emails) before execution reaches business logic. |
| `bcryptjs` | Password hashing | Hashes passwords with cryptographic salts to prevent plaintext credentials from ever touching the database. |
| `jsonwebtoken` | Token-based authentication | Generates stateless, signed JWTs allowing users to remain securely authenticated. |
| `axios` | HTTP client | Sends outbound HTTP requests from the background worker to monitored websites with custom timeouts. |
| `cors` | Cross-Origin Resource Sharing | Configures HTTP headers allowing the Next.js frontend to communicate with Express across ports. |
| `morgan` | HTTP request logger | Automatically logs HTTP methods, status codes, and execution times to the terminal during development. |
| `dotenv` | Environment variable loader | Loads configurations from `.env` files into `process.env`. |
| `nodemon` | Development auto-reloader | Automatically restarts the Node server upon saving changes to source files. |

### Frontend Dependencies

| Package | Purpose | Why It Was Chosen |
|---|---|---|
| `next` | React application framework | Provides App Router, server-side asset optimization, and client routing. |
| `react` | UI component library | Declarative component model for constructing interactive user interfaces. |
| `react-dom` | React DOM renderer | Renders React component trees into browser DOM nodes. |
