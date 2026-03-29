import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage?: number;
  onPageChange: (newPage: number) => void;
  maxPagesAround?: number;
}

export default function Pagination ({
  totalItems,
  currentPage,
  itemsPerPage = 20,
  onPageChange,
  maxPagesAround = 4,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages: (number | '…')[] = [];

    const start = Math.max(2, currentPage - maxPagesAround);
    const end = Math.min(totalPages - 1, currentPage + maxPagesAround);

    pages.push(1); // Always show the first page.

    if (start > 2) pages.push('…');

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push('…');

    if (totalPages > 1) pages.push(totalPages); // Always show the last page.

    return pages.map((page, i) => {
      if (page === '…') {
        return (
          <span
          className="px-2 text-muted"
          key={`ellipsis-${i}`}>…</span>
        );
      }

      return (
        <button
        aria-current={page === currentPage ? 'page' : undefined}
        className="transition-colors inline-flex justify-center items-center shadow-standard size-10 px-[0] rounded-md border border-interface-border bg-white text-center text-primary hover:border-primary-subtle aria-[current='page']:bg-transparent aria-[current='page']:shadow-none aria-[current='page']:border-none aria-[current='page']:text-text-body aria-[current='page']:cursor-default"
        key={page}
        onClick={() => goToPage(page)}
        type="button">{page}</button>
      );
    });
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center gap-x-2">
      <button
      className={`transition-colors inline-flex justify-center items-center gap-x-1 shadow-standard h-10 px-4 rounded-md border border-interface-border bg-white text-center ${currentPage === 1 ? 'text-text-disabled' : 'text-primary hover:border-primary-subtle'}`}
      disabled={currentPage === 1}
      onClick={() => goToPage(currentPage - 1)}
      type="button">
        <ChevronLeft className="size-4 text-primary-subtle" />
        Previous
      </button>

      <div className="flex items-center gap-x-2">
        {renderPageNumbers()}
      </div>

      <button
      className={`transition-colors inline-flex justify-center items-center gap-x-1 shadow-standard h-10 px-4 rounded-md border border-interface-border bg-white text-center ${currentPage === totalPages ? 'text-text-disabled' : 'text-primary hover:border-primary-subtle'}`}
      disabled={currentPage === totalPages}
      onClick={() => goToPage(currentPage + 1)}
      type="button">
        Next
        <ChevronRight className="size-4 text-primary-subtle" />
      </button>
    </nav>
  );
}
