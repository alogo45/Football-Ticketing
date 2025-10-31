# Football-Ticketing

Scaffold awal: Node.js + Express + TypeScript + Postgres (docker-compose)

Quickstart (Windows: PowerShell / WSL recommended)

1) Copy example env:

```powershell
Copy-Item .env.example .env
```

2) Start Postgres (Docker Desktop):

```powershell
docker compose up -d
```

3) Wait for DB ready and initialize schema (PowerShell):

```powershell
# wait until postgres accepts connections
Write-Host "Waiting for postgres..."
while ($true) {
	docker compose exec -T db pg_isready -U app > $null 2>&1
	if ($LASTEXITCODE -eq 0) { break }
	Start-Sleep -Seconds 1
}

# run SQL to create tables and sample data
docker compose exec -T db psql -U app -d football < ./db/init.sql
```

4) Install node dependencies and run dev server (PowerShell or WSL/bash):

```powershell
npm ci
npm run dev
```

5) Health check / sample request:

```powershell
# health
"$BROWSER" http://localhost:3000/health

# use one of the sample ids from the DB and POST an order
curl -v -X POST http://localhost:3000/orders \
	-H "Content-Type: application/json" \
	-H "Idempotency-Key: order-12345" \
	-d '{"user_id":"<USER_ID>","seat_id":"<SEAT_ID>"}'
```

Notes
- POST /orders requires header `Idempotency-Key` and uses DB transaction + row locking to reserve seats idempotently.
- Extend schema, add migrations, tests, and Stripe integration next.

If you want, jalankan perintah di atas lalu tempel output di sini — saya bantu diagnose jika ada error.