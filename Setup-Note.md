Listed directory money-tracker-web
Viewed SETUP_GUIDE.md:1-342
Viewed package.json:1-46

Untuk melakukan setup awal pada project ini (terutama jika Anda baru saja melakukan *clone* repository atau memindahkannya ke komputer baru), berikut adalah urutan command yang perlu Anda jalankan di terminal:

1. **Install Dependencies**
   Jalankan command ini untuk menginstall semua library yang dibutuhkan (termasuk Next.js, Prisma, dan library UI):
   ```bash
   npm install
   ```

2. **Setup Database & Jalankan Migrasi**
   Project ini menggunakan SQLite (`prisma/dev.db`). Jika file database belum ada, command ini akan membuat file tersebut dan menyusun tabel-tabelnya sesuai dengan *schema*:
   ```bash
   npx prisma migrate dev
   ```

3. **Isi Data Awal (Seeding)**
   Jalankan command ini untuk mengisi database dengan data awal yang diperlukan aplikasi, seperti kategori transaksi bawaan dan pengaturan aplikasi:
   ```bash
   npm run seed
   ```

4. **Jalankan Aplikasi**
   Setelah semua setup di atas selesai, Anda baru bisa menjalankan *development server*:
   ```bash
   npm run dev
   ```

**Tambahan:**
Jika Anda ingin melihat atau mengelola isi database (seperti melihat data yang sudah masuk), Anda bisa membuka tab terminal baru dan menjalankan:
```bash
npx prisma studio
```
Ini akan membuka antarmuka database di browser Anda pada alamat `http://localhost:5555`.