# ⚠️ STOP SERVER DULU!

Sebelum lanjut update database schema, harus stop server dulu:

## Step 1: Stop Server
```bash
# Di terminal yang jalan npm run dev
# Tekan: Ctrl + C
```

## Step 2: Generate Prisma Client
```bash
cd "D:\Bahan PS\Pribadi\money-tracker-web"
npx prisma generate
```

## Step 3: Seed Savings Locations
```bash
npm run seed-savings
```

## Step 4: Start Server Lagi
```bash
npm run dev
```

## Jika Error Persist:
1. Close semua terminal
2. Restart VS Code / Command Prompt
3. Jalankan lagi dari step 2

---

**Setelah server di-stop, beri tahu saya untuk lanjut update!**
