-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "income" REAL NOT NULL DEFAULT 0,
    "expense" REAL NOT NULL DEFAULT 0,
    "balance" REAL,
    "isSaving" BOOLEAN NOT NULL DEFAULT false,
    "isReimbursable" BOOLEAN NOT NULL DEFAULT false,
    "reimbursementStatus" TEXT,
    "linkedReimbursementId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "targetIncome" REAL,
    "categoryId" INTEGER NOT NULL,
    "budgetAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "budget_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fixed_expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fixed_expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fixed_expense_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fixedExpenseId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transactionId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fixed_expense_payments_fixedExpenseId_fkey" FOREIGN KEY ("fixedExpenseId") REFERENCES "fixed_expenses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reimbursement_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "receiptFilename" TEXT,
    "receiptPath" TEXT,
    "receiptMimetype" TEXT,
    "submittedAt" DATETIME,
    "paidAt" DATETIME,
    "linkedTransactionId" INTEGER,
    "paidVia" TEXT DEFAULT 'personal',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reimbursement_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reimbursement_batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "batchName" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reimbursement_batch_items" (
    "batchId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    PRIMARY KEY ("batchId", "itemId"),
    CONSTRAINT "reimbursement_batch_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "reimbursement_batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reimbursement_batch_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "reimbursement_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_categoryId_idx" ON "transactions"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_templates_year_month_categoryId_key" ON "budget_templates"("year", "month", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_expense_payments_fixedExpenseId_year_month_key" ON "fixed_expense_payments"("fixedExpenseId", "year", "month");

-- CreateIndex
CREATE INDEX "reimbursement_items_date_idx" ON "reimbursement_items"("date");

-- CreateIndex
CREATE INDEX "reimbursement_items_status_idx" ON "reimbursement_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");
