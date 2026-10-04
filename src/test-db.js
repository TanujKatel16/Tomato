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
