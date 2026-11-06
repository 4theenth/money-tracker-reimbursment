export const CATEGORY_NAME_MAX_LENGTH = 50

export function normalizeCategoryName(name: unknown) {
  return typeof name === 'string' ? name.trim() : ''
}

export function categoryNameError(name: string) {
  if (!name) return 'Nama kategori wajib diisi'
  if (name.length > CATEGORY_NAME_MAX_LENGTH) {
    return `Nama kategori maksimal ${CATEGORY_NAME_MAX_LENGTH} karakter`
  }
  return null
}
