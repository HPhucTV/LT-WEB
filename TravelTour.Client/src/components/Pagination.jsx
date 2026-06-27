export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = 'mục',
}) {
  if (!totalItems) return null

  return (
    <div className="table-pagination">
      <div className="table-pagination-info">
        Hiển thị <strong>{startItem}-{endItem}</strong> / <strong>{totalItems}</strong> {itemLabel}
      </div>

      <div className="table-pagination-actions">
        <label>
          <span>Mỗi trang</span>
          <select value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="table-pagination-buttons">
          <button type="button" className="btn-sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
            Trước
          </button>
          <span>Trang {currentPage}/{totalPages}</span>
          <button type="button" className="btn-sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
            Sau
          </button>
        </div>
      </div>
    </div>
  )
}
