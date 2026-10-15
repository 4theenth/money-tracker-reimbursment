# Money Tracker & Reimbursement App

Aplikasi web untuk tracking pengeluaran pribadi dan reimbursement kantor dengan fitur lengkap manajemen keuangan, tracking tabungan, dan export laporan profesional.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Database:** SQLite (via Prisma ORM)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Image Processing:** Sharp (WebP optimization)
- **Export:** ExcelJS, PDFKit

## Features

### 💰 Transaction Management
- Dual tracking: pengeluaran pribadi dan reimbursement kantor
- Upload dan preview foto struk (WebP optimization, local storage)
- Kategori custom untuk organisasi transaksi
- Filter dan search transaksi

### 🏦 Savings Tracker (Buku Tabungan)
- Tracking multiple tabungan (dompet, celengan, bank, dll)
- History deposit dan withdrawal
- Breakdown saldo per lokasi tabungan

### 🏢 Company Profile Management
- Multiple company profiles dengan logo
- Custom header untuk laporan export
- Default company selection
- Logo optimization (WebP, max 500px)

### 📊 Export & Reporting
- Export Excel dengan embedded images
- Export PDF dengan inline images dan company branding
- Monthly reimbursement reports
- Status tracking (paid/unpaid)
- Pre-export confirmation modal

### 🎨 UI/UX Features
- Responsive design
- Dark navy-blue theme
- Blur backdrop effects untuk modals
- Custom toast notifications
- Click-outside-to-close modals
- ESC key support
- Body scroll lock saat modal open

## Prerequisites

- **Node.js:** 16.x atau lebih tinggi
- **npm** atau **yarn**
- **Git**

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/4theenth/money-tracker-reimbursment.git
cd money-tracker-reimbursment
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

Generate Prisma Client dan buat database:

```bash
npx prisma generate
npx prisma migrate dev
```

Database SQLite akan dibuat di `prisma/dev.db`.

### 4. Setup Environment (Optional)

Buat file `.env` jika diperlukan konfigurasi custom:

```env
DATABASE_URL="file:./dev.db"
```

### 5. Seed Initial Data (Optional)

Untuk menambahkan data contoh:

```bash
npx prisma db seed
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
money-tracker-web/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── categories/       # Category management
│   │   ├── transactions/     # Transaction CRUD
│   │   ├── reimbursements/   # Reimbursement specific
│   │   ├── savings/          # Savings tracker
│   │   ├── companies/        # Company profiles
│   │   └── export/           # Excel & PDF export
│   ├── kategori/             # Category management page
│   ├── transaksi/            # Transaction page
│   ├── reimbursement/        # Reimbursement page
│   ├── tabungan/             # Savings tracker page
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── ui/                   # Reusable UI components
│   ├── QuickAddTransaction.tsx
│   ├── ImageUpload.tsx
│   ├── ReimbursementFormFields.tsx
│   └── ...
├── contexts/                 # React contexts
│   └── NotificationContext.tsx
├── lib/                      # Utilities
│   ├── prisma.ts             # Prisma client
│   └── utils.ts              # Helper functions
├── prisma/                   # Database
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Migration history
│   └── dev.db                # SQLite database
└── public/                   # Static assets
    └── uploads/              # User uploads
        ├── receipts/         # Receipt images
        └── company-logos/    # Company logos
```

## Usage Guide

### 1. Setup Company Profile

Pertama kali menggunakan aplikasi:

1. Buka halaman **Reimbursement**
2. Klik tombol **"🏢 Kelola Perusahaan"**
3. Tambah perusahaan baru dengan nama dan logo
4. Set sebagai default company

### 2. Manage Categories

Customize kategori pengeluaran:

1. Buka halaman **Kategori**
2. Tambah kategori baru (contoh: ATK, Transport, Makan, dll)
3. Pilih warna dan ikon untuk setiap kategori

### 3. Add Transactions

Untuk reimbursement kantor:

1. Buka halaman **Reimbursement**
2. Klik **"➕ Tambah Transaksi"**
3. Isi detail transaksi
4. Upload foto struk (optional)
5. Simpan

Untuk pengeluaran pribadi:

1. Buka halaman **Transaksi**
2. Gunakan Quick Add atau form detail
3. Pilih kategori dan sumber dana

### 4. Export Monthly Report

Untuk klaim reimbursement:

1. Buka halaman **Reimbursement**
2. Pilih bulan yang ingin di-export
3. Pilih company profile (dropdown)
4. Klik **"📥 Export"**
5. Pilih format: **Excel** atau **PDF**

Report akan include:
- Company logo dan header
- Ringkasan total per kategori
- Detail transaksi dengan foto struk inline
- Section untuk approval signatures

### 5. Manage Savings

Track multiple tabungan:

1. Buka halaman **Tabungan**
2. Lihat breakdown saldo per lokasi
3. Add deposit atau withdrawal
4. Lihat history di **Buku Tabungan**

## Database Schema

### Main Models

- **Transaction:** Semua transaksi (pribadi + reimbursement)
- **Category:** Kategori custom
- **ReimbursementCategory:** Kategori khusus reimbursement
- **CompanyProfile:** Profile perusahaan untuk export
- **SavingsLocation:** Lokasi penyimpanan tabungan
- **SavingsTransaction:** History tabungan

Lihat detail schema di: `prisma/schema.prisma`

## Database Tools

### Prisma Studio (GUI)

Untuk explore dan edit data via GUI:

```bash
npx prisma studio
```

Buka: **http://localhost:5555**

### Manual SQL Access

```bash
sqlite3 prisma/dev.db
```

```sql
-- List tables
.tables

-- Query transactions
SELECT * FROM transactions ORDER BY date DESC LIMIT 10;

-- Query categories
SELECT * FROM categories;
```

## Configuration

### Upload Limits

Edit di `app/api/upload/receipt/route.ts`:

- Max file size: **10MB**
- Supported formats: PNG, JPG, WebP
- Auto-optimization: WebP, 1200px max, quality 85%

### Image Storage

Images disimpan di:
- Receipts: `public/uploads/receipts/`
- Company logos: `public/uploads/company-logos/`

### Database Migration

Untuk migrate ke MySQL/PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // atau "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
   ```

3. Run migration:
   ```bash
   npx prisma migrate dev
   ```

## Troubleshooting

### Port 3000 already in use

```bash
# Windows (PowerShell)
Get-Process node | Stop-Process -Force

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Prisma Client not found

```bash
npx prisma generate
```

### Database locked error

Close Prisma Studio atau aplikasi lain yang sedang mengakses database.

### Images not showing

Check folder permissions:
```bash
# Create upload folders if missing
mkdir -p public/uploads/receipts
mkdir -p public/uploads/company-logos
```

## Development Notes

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Conventional commit messages

### Component Patterns

- Server Components by default
- Client Components: use `'use client'` directive
- Shared state via React Context
- Toast notifications: `NotificationContext`

### API Conventions

- RESTful routes
- JSON request/response
- Error handling with try-catch
- HTTP status codes: 200, 201, 400, 404, 500

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

## License

Private project - All rights reserved

## Contact

For questions or support, contact repository owner.

---

**Happy tracking! 💰📊**
