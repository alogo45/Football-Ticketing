import { Router, Request, Response } from "express";
import { Pool, QueryResult } from "pg";
import { pool } from "../db";
import { v4 as uuidv4 } from "uuid";

// Request/Response types
interface OrderRequest {
  user_id: string;
  seat_id: string;
}

interface Order {
  id: string;
  user_id: string;
  seat_id: string;
  status: string;
  created_at: Date;
}

interface OrderResponse {
  order: Order;
  idempotent?: boolean;
}

interface ErrorResponse {
  error: string;
}

const router = Router();

/*
POST /orders
Headers:
  Idempotency-Key: <key>
Body:
  { "user_id": "<uuid>", "seat_id": "<uuid>" }
*/
router.post("/", async (req: Request<{}, OrderResponse | ErrorResponse, OrderRequest>, res: Response) => {
  const idempotencyKey = req.header("Idempotency-Key");
  if (!idempotencyKey) return res.status(400).json({ error: "Idempotency-Key header required" });

  const { user_id, seat_id } = req.body;
  if (!user_id || !seat_id) return res.status(400).json({ error: "user_id and seat_id required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check idempotency
    const idemRes = await client.query<{order_id: string}>(
      "SELECT order_id FROM idempotency_keys WHERE key = $1 FOR UPDATE",
      [idempotencyKey]
    );
    
    if (idemRes?.rowCount && idemRes.rowCount > 0 && idemRes.rows[0]?.order_id) {
      const existingOrder = await client.query<Order>(
        "SELECT * FROM orders WHERE id = $1",
        [idemRes.rows[0].order_id]
      );
      await client.query("COMMIT");
      return res.status(200).json({ idempotent: true, order: existingOrder.rows[0] });
    }

    // Lock seat row
    interface Seat {
      id: string;
      status: "available" | "reserved" | "sold";
      event_id: string;
      row: number;
      number: number;
    }
    
    const seatRes = await client.query<Seat>(
      "SELECT * FROM seats WHERE id = $1 FOR UPDATE",
      [seat_id]
    );
    
    if (seatRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "seat not found" } as ErrorResponse);
    }
    
    const seat = seatRes.rows[0];
    if (seat.status !== "available") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "seat not available" } as ErrorResponse);
    }

    // Reserve seat and create order
    const orderId = uuidv4();
    await client.query("INSERT INTO orders (id, user_id, seat_id, status) VALUES ($1, $2, $3, $4)", [
      orderId,
      user_id,
      seat_id,
      "pending",
    ]);
    await client.query("UPDATE seats SET status = $1 WHERE id = $2", ["reserved", seat_id]);

    // Store idempotency key
    await client.query("INSERT INTO idempotency_keys (key, order_id) VALUES ($1, $2)", [idempotencyKey, orderId]);

    await client.query("COMMIT");

    const orderRes = await pool.query<Order>("SELECT * FROM orders WHERE id = $1", [orderId]);
    return res.status(201).json({ order: orderRes.rows[0] } as OrderResponse);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

export default router;
