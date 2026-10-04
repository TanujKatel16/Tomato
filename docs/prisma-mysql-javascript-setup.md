# Reusable Setup: Prisma + MySQL + JavaScript

**Stack:** Node.js · Express · JavaScript (ES Modules) · MySQL · Prisma ORM

**Recommended for:** New backend projects that use plain JavaScript and want a straightforward Prisma setup.

> This guide uses **Prisma 6** for simplicity. Prisma 7 has a different configuration and client-generation workflow.

---

## 1. Create a Node.js project

```bash
mkdir my-backend
cd my-backend
npm init -y
```

Install Express, Prisma, and dotenv:

```bash
npm install express dotenv
npm install @prisma/client@6
npm install -D prisma@6
```

Set up ES modules in `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  }
}
```

Install nodemon:

```bash
npm install -D nodemon
```

---

## 2. Create a MySQL database

Open MySQL Workbench and execute:

```sql
CREATE DATABASE my_backend;
```

You can verify it with:

```sql
SHOW DATABASES;
```

The database is created in MySQL. Prisma will create and manage the tables inside it.

---

## 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/my_backend"
```

Replace `YOUR_PASSWORD` with your MySQL password.

**Important:**

* `root` is your MySQL username.
* `localhost` is your database host.
* `3306` is the default MySQL port.
* `my_backend` is the database name.
* URL-encode special characters in the password if necessary.

Create a `.gitignore` file:

```gitignore
node_modules/
.env
*.log
```

Never commit your real database credentials to GitHub.

---

## 4. Initialize Prisma

Run:

```bash
npx prisma init
```

For this Prisma 6 setup, the command creates a `prisma` directory and a `schema.prisma` file. It may also create or update `.env`.

Your project structure will look approximately like this:

```text
my-backend/
├── prisma/
│   └── schema.prisma
├── src/
│   └── config/
├── .env
├── .gitignore
├── package.json
└── server.js
```

---

## 5. Define the Prisma schema

Open `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id          Int      @id @default(autoincrement())
  name        String
  email       String   @unique
  phoneNumber String?  @unique
  password    String
  role        String   @default("CUSTOMER")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Understanding the schema

| Syntax                      | Meaning                                       |
| --------------------------- | --------------------------------------------- |
| `model User`                | Defines a database model/table                |
| `Int`                       | Integer data type                             |
| `String`                    | String data type                              |
| `String?`                   | Optional string                               |
| `@id`                       | Primary key                                   |
| `@default(autoincrement())` | Automatically generates IDs                   |
| `@unique`                   | Prevents duplicate values                     |
| `@default(now())`           | Sets the creation timestamp                   |
| `@updatedAt`                | Updates the timestamp when the record changes |

The Prisma model is a representation of your database structure. Prisma maps it to the corresponding MySQL table.

---

## 6. Generate the Prisma client and run the migration

Run:

```bash
npx prisma migrate dev --name init
```

This command:

1. Connects to MySQL.
2. Compares your schema with the existing database structure.
3. Creates a migration file.
4. Applies the migration to your database.
5. Generates the Prisma client.

You should now see the `User` table in MySQL Workbench.

For future schema changes, update your models and run another migration:

```bash
npx prisma migrate dev --name add_restaurant
```

Use meaningful migration names such as `add_order_table` or `add_user_address`.

If you only need to regenerate the client after a schema change, run:

```bash
npx prisma generate
```

---

## 7. Create a reusable Prisma client

Create `src/config/db.js`:

```js
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import prismaPackage from "../generated/prisma/index.js";

const { PrismaClient } = prismaPackage;

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

const prisma = new PrismaClient({ adapter });

export default prisma;
```

This file creates a single reusable Prisma client instance.

**Why reuse one instance?**

Creating a new Prisma client every time you need a query can lead to unnecessary database connections. A shared instance is the usual approach for a single-process Express application.

---

## 8. Test the database connection

Create `src/test-db.js`:

```js
import "dotenv/config";
import prisma from "./config/db.js";

try {
  const result = await prisma.$queryRaw`SELECT 1 AS connected`;
  console.log("Database connected:", result);
} catch (error) {
  console.error("Database connection failed:", error);
} finally {
  await prisma.$disconnect();
}

```

Run it from the project root:

```bash
node src/test-db.js
```

Expected output:

```text
Database connected: [ { connected: 1 } ]
```

This tests whether your application can execute a query through Prisma.

---

## 9. Perform your first CRUD operations

Create `src/test-user.js`:

```js
import prisma from "./config/db.js";

try {
    // CREATE
    const user = await prisma.user.create({
        data: {
            name: "Tanuj",
            email: "tanuj@example.com",
            password: "temporary-password"
        }
    });

    console.log("Created:", user);

    // READ
    const users = await prisma.user.findMany();

    console.log("All users:", users);

    // UPDATE
    const updatedUser = await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            name: "Tanuj Katel"
        }
    });

    console.log("Updated:", updatedUser);

    // DELETE
    await prisma.user.delete({
        where: {
            id: user.id
        }
    });

    console.log("User deleted");
} catch (error) {
    console.error(error);
} finally {
    await prisma.$disconnect();
}
```

Run:

```bash
node src/test-user.js
```

**Security note:** This is only a CRUD demonstration. Never store plain-text passwords in a real application. Hash passwords with a suitable password-hashing library before saving them.

---

## 10. Connect Prisma to Express

A minimal `server.js`:

```js
import "dotenv/config";
import express from "express";
import prisma from "./src/config/db.js";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "Server and database are running"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

Run the application:

```bash
npm run dev
```

Visit:

```text
http://localhost:5000/health
```

You should receive a successful response if the database is reachable.

For a larger project, keep route handlers, controllers, services, and database access in separate modules rather than placing everything in `server.js`.

---

## 11. Useful Prisma commands

| Command                              | Purpose                                                             |
| ------------------------------------ | ------------------------------------------------------------------- |
| `npx prisma init`                    | Initialize Prisma                                                   |
| `npx prisma generate`                | Generate Prisma Client                                              |
| `npx prisma migrate dev --name init` | Create and apply a development migration                            |
| `npx prisma migrate status`          | Check migration status                                              |
| `npx prisma migrate reset`           | Reset the development database and reapply migrations; data is lost |
| `npx prisma studio`                  | Open a visual database browser                                      |
| `npx prisma format`                  | Format the schema                                                   |
| `npx prisma validate`                | Validate the schema                                                 |

Use `migrate reset` only when you're comfortable losing the data in that development database.

---

## 12. Prisma 7: What changes?

Prisma 7 introduced a newer default client generator and configuration workflow. The setup you encountered used:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

This generator produces TypeScript files such as `client.ts`, rather than the `client.js` file your original JavaScript import expected.

Prisma 7 also moves the connection URL into a Prisma config file and uses a database driver adapter for runtime connections.

For example, a Prisma 7 configuration uses a `prisma.config.ts` file with a datasource URL, and a MySQL connection commonly uses `@prisma/adapter-mariadb`.

**Don't mix these two setups.** In particular:

* Prisma 6's standard setup uses `prisma-client-js`, `@prisma/client`, and a datasource URL in `schema.prisma`.
* Prisma 7's recommended setup uses `prisma-client`, a custom generated-client output path, a Prisma config file, and a driver adapter.

When starting a new project, choose one version and follow its matching documentation and generated-client import instructions consistently.

---

## Final checklist

* [ ] Node.js project initialized
* [ ] Prisma and `@prisma/client` installed at matching versions
* [ ] MySQL database created
* [ ] `.env` configured and ignored by Git
* [ ] Prisma schema defined
* [ ] Initial migration applied
* [ ] Prisma client generated
* [ ] Reusable database client created
* [ ] Database connection tested
* [ ] CRUD operations tested
* [ ] Express health endpoint tested

**Recommended habit:** Commit your Prisma schema and migration files to Git. Don't commit `.env` or generated secrets. Migrations are part of your project's source history and help teammates reproduce the database structure.
