# 🚀 Money Tracker Web - Setup Guide

## ✅ Setup Sudah Selesai!

Aplikasi Money Tracker Web Anda sudah siap digunakan!

---

## 📦 Yang Sudah Terinstall

### Tech Stack:
- ✅ **Next.js 16.3.8** - React framework full-stack
- ✅ **TypeScript** - Type safety
- ✅ **Tailwind CSS** - Styling modern
- ✅ **Prisma 5.22.0** - ORM untuk database
- ✅ **SQLite** - Database lokal (file: `prisma/dev.db`)
- ✅ **ExcelJS** - Export to Excel (with images)
- ✅ **Puppeteer** - Export to PDF
- ✅ **Recharts** - Charting library
- ✅ **Lucide React** - Icon library
- ✅ **Radix UI** - Headless UI components

### Database:
- ✅ Schema sudah dibuat
- ✅ Migrations sudah dijalankan
- ✅ Seed data sudah terisi:
  - 16 Categories (Income & Expense)
  - App Settings (currency, theme, dll)

---

## 🎯 Struktur Database

### Tables:
1. **categories** - Kategori transaksi (Gaji, Makanan, dll)
2. **transactions** - Transaksi utama (pemasukan/pengeluaran)
3. **budget_templates** - Budget planning per bulan
4. **fixed_expenses** - Pengeluaran tetap (kost, internet, dll)
5. **fixed_expense_payments** - Tracking pembayaran
6. **reimbursement_items** - Item reimbursement kantor
7. **reimbursement_batches** - Batch submission
8. **app_settings** - Settings aplikasi

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Start Development Server

Buka terminal di folder project, lalu jalankan:

```bash
cd "D:/Bahan PS/Pribadi/money-tracker-web"
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

### 2. Akses di Browser

Buka browser dan ketik: `http://localhost:3000`

### 3. Stop Server

Tekan `Ctrl + C` di terminal untuk menghentikan server.

---

## 📁 Struktur Folder

```
money-tracker-web/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Homepage (Dashboard)
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   └── api/               # API routes (akan dibuat)
│
├── components/            # React components (akan dibuat)
│   ├── dashboard/
│   ├── transactions/
│   ├── budget/
│   └── reimbursement/
│
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
│
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   ├── seed.ts          # Seed data
│   ├── dev.db           # SQLite database file
│   └── migrations/      # Migration history
│
├── public/              # Static files
├── .env                 # Environment variables
└── package.json         # Dependencies
```

---

## 🔧 Commands yang Tersedia

### Development:
```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database:
```bash
npm run seed                    # Seed database dengan data awal
npx prisma studio              # Open Prisma Studio (GUI database)
npx prisma migrate dev         # Create new migration
npx prisma generate            # Generate Prisma Client
```

---

## 🎨 Fitur Yang Sudah Ada

### Homepage (localhost:3000):
- ✅ Dashboard dengan summary cards
  - Total Pemasukan
  - Total Pengeluaran
  - Saldo
- ✅ Quick action buttons
- ✅ Recent transactions
- ✅ Status indicator

### Database:
- ✅ 16 Categories siap pakai
- ✅ Support untuk:
  - Transactions (pribadi)
  - Budget Planning
  - Fixed Expenses
  - Reimbursement Module
  - Savings Tracking

---

## 🚧 Next Development Steps

### Phase 1: Core Features (Week 1-2)
1. **Transactions Page**
   - Form input transaksi
   - List/Table view
   - Filter & search
   - Edit/Delete

2. **Dashboard Enhancement**
   - Charts (income vs expense)
   - Month/Year filter
   - Budget progress bars

3. **Budget Planning Page**
   - Set target income
   - Set budget per kategori
   - Track actual vs target

### Phase 2: Reimbursement Module (Week 3)
4. **Reimbursement Input**
   - Form input pengeluaran kantor
   - Upload foto nota
   - Link to Money Tracker (optional)

5. **Reimbursement Dashboard**
   - Summary cards
   - Status tracking
   - Breakdown by category

6. **Export Features**
   - Generate Excel (with images)
   - Generate PDF (with images)
   - Preview before export

### Phase 3: Additional Features (Week 4-5)
7. **Fixed Expenses**
   - Manage recurring expenses
   - Payment tracking
   - Reminder system

8. **Savings Tracking**
   - Auto-track from "Tabungan" category
   - Goals & progress
   - Trend chart

9. **Settings**
   - Manage categories
   - App preferences
   - Backup/Restore

---

## 💡 Tips Penggunaan

### Port yang Tidak Bentrok:
- Money Tracker: **Port 3000**
- Project Kantor: **Port 8000**
- ✅ Bisa jalan bersamaan!

### Cara Ubah Port (jika perlu):
Edit `package.json`:
```json
"scripts": {
  "dev": "next dev -p 5000"  // Ganti ke port lain
}
```

### Database Location:
File database: `D:/Bahan PS/Pribadi/money-tracker-web/prisma/dev.db`

Untuk backup, cukup copy file `dev.db` ini.

### File Upload:
Foto nota reimbursement akan disimpan di: `./uploads/`
(Folder akan auto-create saat pertama kali upload)

---

## 🔍 Cara Melihat Database

### Option 1: Prisma Studio (Recommended)
```bash
cd "D:/Bahan PS/Pribadi/money-tracker-web"
npx prisma studio
```
Akan buka GUI di browser: http://localhost:5555

### Option 2: SQLite Browser
Download DB Browser for SQLite, lalu buka file `prisma/dev.db`

---

## 🐛 Troubleshooting

### Server tidak jalan di port 3000:
```bash
# Windows - Kill process di port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_number> /F
```

### Database error:
```bash
# Reset database (HATI-HATI: data hilang!)
rm prisma/dev.db
npx prisma migrate dev
npm run seed
```

### Module not found:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📝 Environment Variables

File: `.env`

```env
# Database
DATABASE_URL="file:./dev.db"

# App Settings
NEXT_PUBLIC_APP_NAME="Money Tracker"
NEXT_PUBLIC_COMPANY_NAME="Your Company Name"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880
```

---

## 🎯 Apa Selanjutnya?

### Langkah 1: Test Aplikasi
```bash
cd "D:/Bahan PS/Pribadi/money-tracker-web"
npm run dev
```
Buka: http://localhost:3000

### Langkah 2: Cek Database
```bash
npx prisma studio
```
Buka: http://localhost:5555

### Langkah 3: Development
Saya akan lanjutkan membuat:
1. Transaction CRUD pages
2. Reimbursement module
3. Export features (Excel/PDF)
4. Budget planning

---

## 📞 Need Help?

Jika ada error atau butuh bantuan:
1. Check terminal untuk error messages
2. Check browser console (F12)
3. Tanyakan ke saya untuk debugging

---

## 🎉 Summary

✅ **Setup Completed!**
- Database: SQLite dengan 8 tables
- Seed data: 16 categories + settings
- Tech stack: Next.js + TypeScript + Prisma
- Port: 3000 (tidak bentrok dengan project kantor)

✅ **Ready to Develop!**
- Structure lengkap sudah siap
- Homepage sudah bisa diakses
- Database schema optimal untuk Money Tracker + Reimbursement

🚀 **Next: Development Phase**
- Build transaction pages
- Build reimbursement module
- Implement export features

---

**Selamat mencoba! 🎊**

Untuk memulai development, silakan beri tahu saya fitur mana yang ingin dibangun terlebih dahulu:
- Transaksi page?
- Reimbursement module?
- Budget planning?
- atau fitur lain?
