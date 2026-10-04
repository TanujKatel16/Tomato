# Tomato

Tomato is a food-delivery application project inspired by products such as Zomato. The goal is to learn how to build a production-grade system incrementally: begin with a well-structured monolith, then extract services only when there is a clear architectural reason.

## Current status

The project is at its backend foundation stage. It has a minimal Express 5 server, common request middleware, and a health endpoint. Product features such as accounts, restaurants, menus, ordering, and delivery are not implemented yet.

## Run locally

```bash
npm install
npm run dev
```

The server listens on port `5000` by default. Set `PORT` to override it. Configure `CLIENT_URL` to the frontend origin allowed by CORS. A `.env.example` file is reserved for documenting local environment variables; it is currently empty.

Check `GET /health` for a JSON response indicating that the backend process is running.

## Project notes

See [Project progress and learning plan](docs/PROJECT_STATUS.md) for the implemented foundation, current gaps, and a staged path toward a production-grade application.

For a reusable copy of the current database setup, see [Prisma 7 + MySQL/MariaDB with JavaScript](docs/prisma-mysql-javascript-setup.md).
