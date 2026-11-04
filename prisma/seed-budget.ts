import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Self-contained embedded data from Money Tracker V7
const budgetData = [
  {
    year: 2026,
    month: 9, // September
    targetIncome: 5000000,
    items: [
      { categoryName: 'Makanan & Minuman', targetAmount: 1500000 },
      { categoryName: 'Transportasi', targetAmount: 500000 },
      { categoryName: 'Kost', targetAmount: 1000000 },
      { categoryName: 'Utilitas', targetAmount: 300000 },
      { categoryName: 'Kesehatan', targetAmount: 200000 },
      { categoryName: 'Hiburan', targetAmount: 300000 },
      { categoryName: 'Persepuluhan', targetAmount: 500000 },
      { categoryName: 'Pendidikan', targetAmount: 200000 },
      { categoryName: 'Tabungan', targetAmount: 500000 },
      { categoryName: 'Lain-lain', targetAmount: 300000 },
    ],
  },
  {
    year: 2026,
    month: 10, // Oktober
    targetIncome: 5000000,
    items: [
      { categoryName: 'Makanan & Minuman', targetAmount: 1500000 },
      { categoryName: 'Transportasi', targetAmount: 500000 },
      { categoryName: 'Kost', targetAmount: 1000000 },
      { categoryName: 'Utilitas', targetAmount: 300000 },
      { categoryName: 'Kesehatan', targetAmount: 200000 },
      { categoryName: 'Hiburan', targetAmount: 300000 },
      { categoryName: 'Persepuluhan', targetAmount: 500000 },
      { categoryName: 'Pendidikan', targetAmount: 200000 },
      { categoryName: 'Tabungan', targetAmount: 500000 },
      { categoryName: 'Lain-lain', targetAmount: 300000 },
    ],
  },
  {
    year: 2026,
    month: 11, // November
    targetIncome: 5500000,
    items: [
      { categoryName: 'Makanan & Minuman', targetAmount: 1500000 },
      { categoryName: 'Transportasi', targetAmount: 600000 },
      { categoryName: 'Kost', targetAmount: 1000000 },
      { categoryName: 'Utilitas', targetAmount: 300000 },
      { categoryName: 'Kesehatan', targetAmount: 200000 },
      { categoryName: 'Hiburan', targetAmount: 400000 },
      { categoryName: 'Persepuluhan', targetAmount: 500000 },
      { categoryName: 'Pendidikan', targetAmount: 200000 },
      { categoryName: 'Tabungan', targetAmount: 600000 },
      { categoryName: 'Lain-lain', targetAmount: 300000 },
    ],
  },
  {
    year: 2026,
    month: 12, // Desember
    targetIncome: 6000000,
    items: [
      { categoryName: 'Makanan & Minuman', targetAmount: 1800000 },
      { categoryName: 'Transportasi', targetAmount: 500000 },
      { categoryName: 'Kost', targetAmount: 1000000 },
      { categoryName: 'Utilitas', targetAmount: 350000 },
      { categoryName: 'Kesehatan', targetAmount: 200000 },
      { categoryName: 'Hiburan', targetAmount: 500000 },
      { categoryName: 'Persepuluhan', targetAmount: 500000 },
      { categoryName: 'Pendidikan', targetAmount: 200000 },
      { categoryName: 'Tabungan', targetAmount: 700000 },
      { categoryName: 'Lain-lain', targetAmount: 350000 },
    ],
  },
]

async function main() {
  console.log('🌱 Seeding initial budget data...')

  const categories = await prisma.category.findMany()
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]))

  for (const period of budgetData) {
    const budgetPeriod = await prisma.budgetPeriod.upsert({
      where: {
        month_year: {
          month: period.month,
          year: period.year,
        },
      },
      update: {
        targetIncome: period.targetIncome,
      },
      create: {
        month: period.month,
        year: period.year,
        targetIncome: period.targetIncome,
      },
    })

    console.log(`  📅 Budget Period: Bulan ${period.month}/${period.year}`)

    for (const item of period.items) {
      const categoryId = categoryMap.get(item.categoryName)
      if (!categoryId) {
        console.warn(`     ⚠️ Kategori tidak ditemukan: ${item.categoryName}`)
        continue
      }

      await prisma.budgetItem.upsert({
        where: {
          budgetPeriodId_categoryId: {
            budgetPeriodId: budgetPeriod.id,
            categoryId,
          },
        },
        update: {
          targetAmount: item.targetAmount,
        },
        create: {
          budgetPeriodId: budgetPeriod.id,
          categoryId,
          targetAmount: item.targetAmount,
        },
      })
    }
  }

  console.log('✅ Initial budget data seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding budget:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
