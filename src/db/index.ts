import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://app:pass@localhost:5432/football";

export const pool = new Pool({
  connectionString,
});
