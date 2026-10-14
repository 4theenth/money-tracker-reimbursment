import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding additional categories and savings locations...')

  // Add new income categories for savings
  const newCategories = [
    { name: 'Penarikan Tabungan', type: 'income', icon: '💸', color: '#8b5cf6' },
    { name: 'Bunga Tabungan', type: 'income', icon: '📊', color: '#a78bfa' },
  ]

  for (const category of newCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name },
    })
    
    if (!existing) {
      await prisma.category.create({
        data: category,
      })
      console.log(`  ✅ Created category: ${category.name}`)
    } else {
      console.log(`  ⏭️  Category already exists: ${category.name}`)
    }
  }

  // Add savings locations to app settings
  const savingsLocations = [
    'Bank BCA',
    'Bank Mandiri',
    'Bank BRI',
    'Bank BNI',
    'Bank Permata',
    'Gopay',
    'Dana',
    'OVO',
    'ShopeePay',
    'Celengan Rumah',
    'Lainnya',
  ]

  const existingLocations = await prisma.appSettings.findUnique({
    where: { key: 'savings_locations' }
  })

  if (!existingLocations) {
    await prisma.appSettings.create({
      data: {
        key: 'savings_locations',
        value: JSON.stringify(savingsLocations),
      },
    })
    console.log('  ✅ Created savings locations')
  } else {
    console.log('  ⏭️  Savings locations already exist')
  }

  console.log('🎉 Additional seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
