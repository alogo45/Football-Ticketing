import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import ordersRouter from "./routes/orders";
import { pool } from "./db";

// Define error response type
interface ErrorResponse {
  error: string;
}

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
// serve static demo page
app.use(express.static("public"));

app.get("/health", (_req, res) => {
  return res.json({ ok: true });
});

// root route: return a simple ok message so GET / from browsers doesn't show "Cannot GET /"
app.get("/", (_req, res) => {
  return res.json({ ok: true, msg: "Football Ticketing API" });
});

// avoid browser console error for missing favicon
app.get('/favicon.ico', (_req, res) => res.sendStatus(204));

app.use("/orders", ordersRouter);

const port = Number(process.env.PORT || 3000);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' } as ErrorResponse);
  next(err);
});

const startServer = async () => {
  try {
    // Test DB connection
    await pool.query("SELECT 1");
    console.log("DB connected");

    // Start server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on http://0.0.0.0:${port}`);
    });
  } catch (e) {
    console.error("Startup error:", e);
    process.exit(1);
  }
};

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
