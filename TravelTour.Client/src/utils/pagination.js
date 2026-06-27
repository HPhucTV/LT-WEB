export function paginateItems(items, page, pageSize) {
  const safePageSize = Math.max(1, Number(pageSize) || 10)
  const totalItems = Array.isArray(items) ? items.length : 0
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const startIndex = (currentPage - 1) * safePageSize
  const endIndex = startIndex + safePageSize

  return {
    currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: Math.min(endIndex, totalItems),
    items: items.slice(startIndex, endIndex),
  }
}
