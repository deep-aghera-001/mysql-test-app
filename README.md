# MySQL CRUD Connectivity Tester

Minimal Node.js + Express application that performs end-to-end CRUD calls against an existing MySQL database. Use it to confirm that network rules, credentials, and SSL settings are correct before wiring a full application.

## 1. Project Setup (Step-by-Step)
1. **Clone or copy the project** into your test machine.
2. **Install dependencies**: `npm install`.
3. **Configure environment variables**:
  - Update the `.env` file with your real MySQL connection values.
  - Alternatively, set a single `DATABASE_URL=mysql://user:pass@host:port/database?ssl-mode=REQUIRED` entry; it overrides the individual `DB_*` variables.
  - Keep the dummy values committed; only your local copy should carry secrets.
  - Optional: store SSL CA files under `certs/` and point `DB_SSL_CA_PATH` to the PEM file (still required even when using `DATABASE_URL`).
4. **Start the API server**:
   - Development with live reload: `npm run dev`.
   - Production-style run: `npm start`.
5. **Ping the health endpoint** at `GET http://localhost:3000/health` to confirm the server booted.
6. **Exercise CRUD endpoints** using Postman or curl (examples below).

## 2. Folder Structure
```
mysql-app-test/
├─ .env (dummy placeholders only)
├─ .env.example
├─ package.json
├─ src/
│  ├─ config/db.js
│  ├─ controllers/userController.js
│  ├─ middleware/errorHandler.js
│  ├─ models/userModel.js
│  ├─ routes/userRoutes.js
│  └─ server.js
└─ README.md
```
- `server.js`: Express entry point that loads env vars, attaches middleware, and boots the HTTP listener after verifying MySQL connectivity.
- `config/db.js`: Centralized mysql2 pool configuration, including optional SSL handling.
- `models/`: Parameterized SQL queries that interact with the `users` table.
- `controllers/`: HTTP-friendly wrappers that validate payloads, invoke models, and return status codes.
- `routes/`: Express router mounting CRUD endpoints under `/api/users`.
- `middleware/errorHandler.js`: Consistent JSON error responses for failed database calls or validation issues.

## 3. Database Connection Logic
- Located in `src/config/db.js`.
- Accepts either discrete `DB_HOST`/`DB_USER`/etc. variables **or** a single `DATABASE_URL`; the connection string takes precedence and is parsed into the same pool settings.
- Uses `mysql2/promise` to build a connection pool with sensible defaults (`waitForConnections`, `connectionLimit`, etc.).
- The `verifyConnection()` helper runs `pool.getConnection()` + `ping()` during startup, logging success or throwing to stop the server if credentials/network are invalid.
- SSL:
  - Set `DB_SSL_MODE=require` (or append `?ssl-mode=REQUIRED` to the connection string) to enable TLS.
  - Provide `DB_SSL_CA_PATH` if your provider mandates CA verification; otherwise the code falls back to `rejectUnauthorized: false` so that you can at least test connectivity.
  - When using `DATABASE_URL`, you still configure the CA path via `DB_SSL_CA_PATH`.

**Connection string example**

```
DATABASE_URL="mysql://doadmin:p%40ssw0rd@db-do-user-12345-0.b.db.ondigitalocean.com:25060/defaultdb?ssl-mode=REQUIRED"
DB_SSL_CA_PATH=./certs/ca.pem
```

Remember to URL-encode special characters in the username/password portion.

## 4. Sample `users` Table
Create the target table ahead of time (or reuse an existing one) with the following schema:
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
Feel free to add extra columns; the model selects `id, name, email, created_at` only.

## 5. CRUD Query Implementation
- All SQL lives in `src/models/userModel.js` and every statement is parameterized via `pool.execute(sql, params)` to eliminate injection issues.
- `createUser`: `INSERT` + `SELECT` to return the persisted row.
- `getUsers`: `SELECT` all rows ordered by `created_at DESC`.
- `getUserById`: `SELECT` by primary key.
- `updateUser`: Dynamically builds the `SET` clause from provided fields and re-fetches the updated row.
- `deleteUser`: `DELETE` by id and returns whether a row was removed.

## 6. API Reference & Test Calls
Base URL defaults to `http://localhost:3000/api/users`.

| Action | Method & URL | Sample curl |
| --- | --- | --- |
| Create | `POST /api/users` | `curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com"}'` |
| Read all | `GET /api/users` | `curl http://localhost:3000/api/users` |
| Read by id | `GET /api/users/:id` | `curl http://localhost:3000/api/users/1` |
| Update | `PUT /api/users/:id` | `curl -X PUT http://localhost:3000/api/users/1 -H "Content-Type: application/json" -d '{"name":"Updated User"}'` |
| Delete | `DELETE /api/users/:id` | `curl -X DELETE http://localhost:3000/api/users/1` |

**Postman workflow**
1. Import the requests manually or via a collection.
2. Set `{{baseUrl}}` environment variable to `http://localhost:3000`.
3. For SSL-enabled databases, confirm your CA cert path is configured before starting the server.
4. Send each CRUD request in order (POST → GET all → GET by ID → PUT → DELETE) and inspect HTTP status codes plus JSON bodies.

## 7. Error Handling & Logging
- Connection failures throw during startup and stop the server, so you immediately know if credentials or firewall rules are wrong.
- Controller-level validation returns `400` when mandatory fields are missing and `404` when records do not exist.
- The error middleware (`src/middleware/errorHandler.js`) includes stack traces outside production to aid debugging.

## 8. Next Steps
- Swap the dummy `.env` values with your secrets locally (never commit real credentials).
- Adjust the `users` schema or create new models/routes to test other tables.
- Integrate the API into automated health checks or CI smoke tests as needed.
