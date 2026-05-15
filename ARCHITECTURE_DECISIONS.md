# SportsTalk — Architecture Decision Records

---

## ADR-001: Monorepo Structure

**Date:** May 2026  
**Status:** Accepted

### Context
The project requires a React frontend and a Node.js/Express backend. These could be maintained as separate repositories or combined into one.

### Decision
Organize the project as a monorepo with two top-level folders: `/client` for the React frontend and `/server` for the Express backend.

### Rationale
A monorepo simplifies development by keeping related code in one place, enables a single Git history for coordinated changes across frontend and backend, and simplifies Railway deployment since both can be built and started from one repository with a single `railway.toml` configuration.

### Consequences
Both frontend and backend are versioned together. A change to an API contract requires coordinated changes in the same commit, reducing the risk of version mismatch between client and server in production.

---

## ADR-002: Cloudinary Over AWS S3

**Date:** May 2026  
**Status:** Accepted

### Context
The original Sports Forum class project used AWS S3 for image storage backed by a CloudFront CDN. The rebuild needed image upload and storage for user posts.

### Decision
Replace AWS S3 and CloudFront with Cloudinary for all image upload, storage, and delivery.

### Rationale
Cloudinary provides a free tier with no credit card required for basic usage, a Node.js SDK with straightforward upload and delete APIs, and automatic image optimization and CDN delivery out of the box. AWS S3 requires IAM credential management, bucket policy configuration, and a separate CloudFront distribution — significant setup overhead for a portfolio project. Cloudinary reduces infrastructure complexity without sacrificing capability.

### Consequences
Images are stored and served through Cloudinary's CDN. When a post is deleted, the corresponding Cloudinary asset is also deleted using the stored public ID, keeping storage in sync with the database. The tradeoff is vendor dependency on Cloudinary's free tier limits.

---

## ADR-003: PostgreSQL Over MySQL

**Date:** May 2026  
**Status:** Accepted

### Context
The original Sports Forum used MySQL as its database. The rebuild required a relational database for users, posts, likes, and comments.

### Decision
Use PostgreSQL instead of MySQL.

### Rationale
PostgreSQL is the database used in the UHPS project, making it the consistent choice across both portfolio projects. Railway provides a managed PostgreSQL service as a first-class offering with straightforward provisioning. PostgreSQL's stronger standards compliance and support for advanced features such as partial indexes and JSON operators provides more flexibility for future schema evolution.

### Consequences
Both portfolio projects (UHPS and SportsTalk) use the same database engine, reinforcing PostgreSQL proficiency. Railway's managed PostgreSQL service handles backups, connection pooling, and availability automatically.

---

## ADR-004: Prisma ORM

**Date:** May 2026  
**Status:** Accepted

### Context
The backend needs to interact with a PostgreSQL database. Options include raw SQL queries, a query builder such as Knex, or a full ORM.

### Decision
Use Prisma as the ORM for all database access.

### Rationale
Prisma provides a type-safe query API generated from a declarative schema file, making it straightforward to define and evolve the data model. The Prisma schema serves as authoritative documentation of the database structure. Prisma's migration system produces versioned SQL migration files that can be reviewed and applied consistently across environments. The original Sports Forum already used Prisma, so this decision carries forward proven tooling.

### Consequences
All database queries go through the Prisma client. Schema changes require generating and applying migrations. The `schema.prisma` file serves as the single source of truth for the data model.

---

## ADR-005: JWT Authentication

**Date:** May 2026  
**Status:** Accepted

### Context
The original Sports Forum had no authentication — usernames were hardcoded. The rebuild required real user accounts with secure authentication.

### Decision
Implement stateless JWT-based authentication with a 7-day token expiry, stored in localStorage on the client.

### Rationale
JWTs are stateless, meaning the server does not need to store session data or maintain a session store. This simplifies the architecture since any server instance can validate a token without shared state. A 7-day expiry balances security with user convenience, avoiding frequent re-authentication. The token is attached to requests via an Axios interceptor, making auth transparent to individual API call sites.

### Consequences
Authentication state lives in the client's localStorage. Tokens cannot be invalidated server-side before expiry without additional infrastructure such as a token blocklist. For a portfolio project this tradeoff is acceptable. Passwords are hashed with bcrypt before storage — the JWT carries only the user's ID and username, never the password or sensitive data.

---

## ADR-006: TheSportsDB as Sports Data Source

**Date:** May 2026  
**Status:** Accepted

### Context
The forum needed live or recent sports data across multiple leagues (NBA, NFL, MLB, NHL, MLS) to differentiate it from a generic image posting app.

### Decision
Proxy requests to TheSportsDB's free public API (API key "3") from the Express backend, returning standings or recent results per league.

### Rationale
TheSportsDB provides free access to sports data for NBA, NFL, MLB, NHL, and MLS without requiring a paid API key for basic endpoints. Proxying through the backend rather than calling TheSportsDB directly from the frontend avoids CORS issues and keeps the API key (even a public one) out of client-side code. A fallback from standings to recent past events handles cases where standings data is unavailable for the current season format.

### Consequences
Sports data is fetched on demand per league tab click. TheSportsDB's free tier has rate limits and may return inconsistent data formats across leagues. The backend normalizes the response into a consistent shape before sending it to the frontend.

---

## ADR-007: Express Static Serving in Production

**Date:** May 2026  
**Status:** Accepted

### Context
The monorepo has a React frontend that needs to be served in production. Options include a separate static hosting service (Vercel, Netlify) or serving the built React files directly from the Express backend.

### Decision
Serve the React production build as static files from Express when `NODE_ENV=production`.

### Rationale
Serving the frontend from the same Express server eliminates the need for a second deployment target, simplifies CORS configuration since frontend and backend share the same origin, and reduces infrastructure complexity for a portfolio project. Railway hosts a single service that handles both API requests and frontend delivery.

### Consequences
The React app is built during the Railway build phase and the resulting `dist/` folder is served by Express at runtime. All non-API routes fall through to `index.html` to support React Router's client-side navigation. The tradeoff is that frontend and backend are coupled in deployment — updating one requires redeploying both.

---

## ADR-008: Railway Deployment Strategy

**Date:** May 2026  
**Status:** Accepted

### Context
The application requires a Node.js runtime, a PostgreSQL database, and environment variable management. Multiple deployment platforms were considered including Vercel, Render, and Railway.

### Decision
Deploy to Railway with a single service hosting the Express backend and React build, using a managed Railway PostgreSQL service in the same project.

### Rationale
Railway was already in use for the UHPS project, making it the consistent deployment platform across both portfolio projects. Railway's managed PostgreSQL integrates cleanly via the `${{Postgres.DATABASE_URL}}` variable reference, which Railway resolves automatically to the internal connection string at runtime. A single Railway service hosting both frontend and backend simplifies the deployment pipeline.

### Consequences
The build phase installs dependencies and builds the React app. The start command runs `prisma db push` to synchronize the schema against the Railway internal database before starting the server. This ensures tables exist on first deploy without requiring manual migration steps.

---

## ADR-009: Cascade Deletes on Post Relations

**Date:** May 2026  
**Status:** Accepted

### Context
The Post model has two dependent relations: Like and Comment. When a post is deleted, the associated likes and comments must also be removed to maintain referential integrity.

### Decision
Add `onDelete: Cascade` to both the Like → Post and Comment → Post foreign key relations in the Prisma schema.

### Rationale
Without cascade deletes, attempting to delete a post with existing likes or comments would fail with a foreign key constraint violation. Cascade deletes handle this automatically at the database level, removing the need for application-level cleanup logic before each delete operation. Since likes and comments have no meaning independent of their parent post, cascading is semantically correct.

### Consequences
Deleting a post automatically removes all associated likes and comments from the database. This behavior is handled by PostgreSQL's foreign key constraint enforcement, not application code, making it reliable even if the delete is triggered outside the application.

---

## ADR-010: bcrypt for Password Hashing

**Date:** May 2026  
**Status:** Accepted

### Context
User passwords must be stored securely. Storing plaintext passwords or using fast hashing algorithms such as MD5 or SHA-256 exposes users to credential theft if the database is compromised.

### Decision
Hash all passwords with bcrypt before storage, using the default salt rounds (10).

### Rationale
bcrypt is specifically designed for password hashing. Its adaptive cost factor means it can be tuned to remain slow as hardware improves, making brute-force attacks expensive. Unlike general-purpose cryptographic hash functions, bcrypt incorporates a salt automatically, preventing rainbow table attacks. 10 salt rounds is the widely accepted default that balances security and performance for web application login flows.

### Consequences
Passwords are never stored in plaintext. Authentication compares the submitted password against the stored hash using bcrypt's constant-time comparison, preventing timing attacks. Password recovery requires a reset flow rather than retrieval, which is the correct behavior.
