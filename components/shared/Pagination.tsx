// ============================================
// FILE: components/ui/Pagination.tsx
// Type-safe, theme-aware pagination component
// ============================================
import { useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PaginationProps {
    currentPage?: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange = () => {},
    onItemsPerPageChange = () => {},
    className,
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // Generate page numbers for pagination
    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    // Hide pagination if there's only one page or fewer items
    if (totalPages <= 1) return null;

    return (
        <div className={cn(
            "bg-card px-4 md:px-6 py-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-b-xl",
            className
        )}>
            {/* Left side - Results info and items per page */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                <div className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{startIndex + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium text-foreground">{endIndex}</span>
                    {' '}of{' '}
                    <span className="font-medium text-foreground">{totalItems}</span>
                </div>

                <div className="flex items-center gap-2">
                    <label 
                        htmlFor="itemsPerPage" 
                        className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap"
                    >
                        Per page:
                    </label>
                    <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className={cn(
                            "border border-border rounded-lg pl-3 pr-8 py-1.5 text-xs sm:text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                            "bg-background text-foreground cursor-pointer transition-all",
                            "hover:bg-muted"
                        )}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a1a1aa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.25em 1.25em',
                            paddingRight: '2rem',
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Right side - Pagination controls */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 md:gap-2">
                {/* First page button */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className={cn(
                        "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg border transition-all",
                        currentPage === 1
                            ? 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                            : 'border-border text-foreground hover:bg-muted hover:border-primary'
                    )}
                    title="First page"
                    aria-label="Go to first page"
                >
                    <ChevronsLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>

                {/* Previous page button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                        "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg border transition-all",
                        currentPage === 1
                            ? 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                            : 'border-border text-foreground hover:bg-muted hover:border-primary'
                    )}
                    title="Previous page"
                    aria-label="Go to previous page"
                >
                    <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>

                {/* Page numbers with ellipses */}
                <div className="flex items-center gap-1 md:gap-1.5">
                    {/* Beginning ellipsis and first page */}
                    {totalPages > 5 && currentPage > 3 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className="hidden sm:flex w-8 h-8 md:w-9 md:h-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted hover:border-primary text-xs md:text-sm font-medium transition-all"
                                aria-label="Go to page 1"
                            >
                                1
                            </button>
                            {currentPage > 4 && (
                                <span className="hidden sm:inline px-1 md:px-2 text-muted-foreground text-xs md:text-sm">
                                    ...
                                </span>
                            )}
                        </>
                    )}

                    {/* Main page numbers */}
                    {pageNumbers.map((pageNumber) => (
                        <button
                            key={pageNumber}
                            onClick={() => onPageChange(pageNumber)}
                            className={cn(
                                "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg border text-xs md:text-sm font-medium transition-all",
                                currentPage === pageNumber
                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                    : 'border-border text-foreground hover:bg-muted hover:border-primary'
                            )}
                            aria-label={`Go to page ${pageNumber}`}
                            aria-current={currentPage === pageNumber ? 'page' : undefined}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    {/* Ending ellipsis and last page */}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                            {currentPage < totalPages - 3 && (
                                <span className="hidden sm:inline px-1 md:px-2 text-muted-foreground text-xs md:text-sm">
                                    ...
                                </span>
                            )}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="hidden sm:flex w-8 h-8 md:w-9 md:h-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted hover:border-primary text-xs md:text-sm font-medium transition-all"
                                aria-label={`Go to page ${totalPages}`}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                {/* Next page button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                        "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg border transition-all",
                        currentPage === totalPages
                            ? 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                            : 'border-border text-foreground hover:bg-muted hover:border-primary'
                    )}
                    title="Next page"
                    aria-label="Go to next page"
                >
                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>

                {/* Last page button */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={cn(
                        "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg border transition-all",
                        currentPage === totalPages
                            ? 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                            : 'border-border text-foreground hover:bg-muted hover:border-primary'
                    )}
                    title="Last page"
                    aria-label="Go to last page"
                >
                    <ChevronsRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;