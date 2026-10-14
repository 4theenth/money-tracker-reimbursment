import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Categories
  const categories = [
    // Income Categories
    { name: 'Gaji', type: 'income', icon: '💰', color: '#10b981' },
    { name: 'Bonus', type: 'income', icon: '🎁', color: '#34d399' },
    { name: 'Investasi', type: 'income', icon: '📈', color: '#6ee7b7' },
    { name: 'Freelance', type: 'income', icon: '💼', color: '#059669' },
    { name: 'Reimbursement Diterima', type: 'income', icon: '💵', color: '#047857' },

    // Expense Categories
    { name: 'Makanan & Minuman', type: 'expense', icon: '🍔', color: '#ef4444' },
    { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#f97316' },
    { name: 'Kost', type: 'expense', icon: '🏠', color: '#f59e0b' },
    { name: 'Utilitas', type: 'expense', icon: '💡', color: '#eab308' },
    { name: 'Kesehatan', type: 'expense', icon: '🏥', color: '#84cc16' },
    { name: 'Hiburan', type: 'expense', icon: '🎮', color: '#22c55e' },
    { name: 'Persepuluhan', type: 'expense', icon: '🙏', color: '#14b8a6' },
    { name: 'Pendidikan', type: 'expense', icon: '📚', color: '#06b6d4' },
    { name: 'Tabungan', type: 'expense', icon: '💎', color: '#0ea5e9' },
    { name: 'Lain-lain', type: 'expense', icon: '📦', color: '#6b7280' },
    { name: 'Reimbursement Kantor', type: 'expense', icon: '🏢', color: '#8b5cf6' },
  ]

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name },
    })
    
    if (!existing) {
      await prisma.category.create({
        data: category,
      })
      console.log(`  ✅ Created category: ${category.name}`)
    }
  }

  console.log('✅ Transaction categories seeded')

  // Seed Reimbursement Office Categories
  const reimbursementCategories = [
    { name: 'ATK (Alat Tulis Kantor)', icon: '✏️' },
    { name: 'Konsumsi Meeting', icon: '☕' },
    { name: 'Transportasi', icon: '🚕' },
    { name: 'Materai & Dokumen', icon: '📄' },
    { name: 'Listrik & Utilitas', icon: '⚡' },
    { name: 'Internet & Komunikasi', icon: '📡' },
    { name: 'Peralatan Kantor', icon: '🖥️' },
    { name: 'Perlengkapan Kebersihan', icon: '🧹' },
    { name: 'Fotokopi & Print', icon: '🖨️' },
    { name: 'Parkir', icon: '🅿️' },
    { name: 'Lain-lain', icon: '📦' },
  ]

  for (const category of reimbursementCategories) {
    const existing = await prisma.reimbursementCategory.findFirst({
      where: { name: category.name },
    })
    
    if (!existing) {
      await prisma.reimbursementCategory.create({
        data: category,
      })
      console.log(`  ✅ Created reimbursement category: ${category.name}`)
    }
  }

  console.log('✅ Reimbursement categories seeded')

  // Seed App Settings
  const settings = [
    { key: 'company_name', value: 'Your Company Name' },
    { key: 'currency', value: 'IDR' },
    { key: 'date_format', value: 'DD/MM/YYYY' },
    { key: 'theme', value: 'light' },
  ]

  for (const setting of settings) {
    const existing = await prisma.appSettings.findUnique({
      where: { key: setting.key },
    })
    
    if (!existing) {
      await prisma.appSettings.create({
        data: setting,
      })
      console.log(`  ✅ Created setting: ${setting.key}`)
    }
  }

  console.log('✅ App settings seeded')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
