import Button from "./Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-1 pt-4 text-sm">
      <span className="text-slate-500">Page {page} of {totalPages} · {total} total</span>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
        <Button size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
