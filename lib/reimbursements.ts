import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const PAYMENT_CATEGORY_NAME = 'Reimbursement Diterima'

const REIMBURSEMENT_INCLUDE = {
  transaction: { include: { category: true } },
  officeCategory: true,
} satisfies Prisma.ReimbursementInclude

export async function recalculateBalances() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: 'asc' },
  })

  let balance = 0
  for (const transaction of transactions) {
    balance = balance + transaction.income - transaction.expense
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { balance },
    })
  }
}

async function getPaymentCategoryId(tx: Prisma.TransactionClient) {
  const category = await tx.category.findFirst({
    where: { name: PAYMENT_CATEGORY_NAME, type: 'income' },
  })
  if (category) return category.id

  const created = await tx.category.create({
    data: { name: PAYMENT_CATEGORY_NAME, type: 'income', icon: '💵', color: '#047857' },
  })
  return created.id
}

/**
 * Marking a claim as paid records the office's payment as income, in the account
 * the expense came from. Marking it unpaid removes that income again.
 */
export async function setReimbursementStatus(id: number, status: 'pending' | 'paid') {
  const reimbursement = await prisma.$transaction(async (tx) => {
    const current = await tx.reimbursement.findUniqueOrThrow({
      where: { id },
      include: REIMBURSEMENT_INCLUDE,
    })
    if (current.status === status) return current

    if (status === 'paid') {
      const paidDate = new Date()
      const payment = await tx.transaction.create({
        data: {
          date: paidDate,
          categoryId: await getPaymentCategoryId(tx),
          description: `Penggantian: ${current.transaction.description}`,
          income: current.transaction.expense,
          expense: 0,
          savingsLocation: current.transaction.savingsLocation || 'Tunai / Dompet',
        },
      })
      return tx.reimbursement.update({
        where: { id },
        data: { status, paidDate, paymentTransactionId: payment.id },
        include: REIMBURSEMENT_INCLUDE,
      })
    }

    const updated = await tx.reimbursement.update({
      where: { id },
      data: { status, paidDate: null, paymentTransactionId: null },
      include: REIMBURSEMENT_INCLUDE,
    })
    if (current.paymentTransactionId) {
      await tx.transaction.delete({ where: { id: current.paymentTransactionId } })
    }
    return updated
  })

  await recalculateBalances()
  return reimbursement
}

/** Removes the claim and its recorded payment. The original expense stays. */
export async function deleteReimbursement(id: number) {
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.reimbursement.delete({ where: { id } })
    if (deleted.paymentTransactionId) {
      await tx.transaction.delete({ where: { id: deleted.paymentTransactionId } })
    }
  })
  await recalculateBalances()
}

/**
 * Deleting a claim's expense also removes its recorded payment. Deleting the
 * payment itself returns the claim to unpaid.
 */
export async function deleteTransactionWithLinks(id: number) {
  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUniqueOrThrow({
      where: { id },
      include: { reimbursement: true, reimbursementPayment: true },
    })

    if (transaction.reimbursementPayment) {
      await tx.reimbursement.update({
        where: { id: transaction.reimbursementPayment.id },
        data: { status: 'pending', paidDate: null, paymentTransactionId: null },
      })
    }

    await tx.transaction.delete({ where: { id } })

    if (transaction.reimbursement?.paymentTransactionId) {
      await tx.transaction.delete({ where: { id: transaction.reimbursement.paymentTransactionId } })
    }
  })
  await recalculateBalances()
}
