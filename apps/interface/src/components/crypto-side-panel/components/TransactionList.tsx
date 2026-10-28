import { Button } from "#/components/ui/button.js";
import { SearchInput } from "#/components/ui/search-input.js";
import { ScrollArea } from "#/components/ui/scroll-area.js";
import { Skeleton } from "#/components/ui/skeleton.js";
import { useTransactionData } from "#/lib/queries.js";
import { lib } from "#/lib/sdk.js";
import { sutils } from "@nemi-fi/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  Search,
} from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { EmptyState } from "./EmptyState.js";

// Loading skeleton for transactions
function TransactionSkeleton() {
  return (
    <div className="flex items-center space-x-4 rounded-xl border p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-[120px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
    </div>
  );
}

export function TransactionList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: transactions, isLoading } = useTransactionData();

  // Filter transactions based on search query
  const filteredTransactions = transactions
    ? transactions.filter(
        (tx) =>
          tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.hash.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Search */}
      <div className="px-4 pb-2">
        <SearchInput
          placeholder="Search transactions..."
          className="h-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search transactions"
        />
      </div>

      {/* Transaction List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <TransactionSkeleton key={i} />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div>
              <EmptyState
                icon={searchQuery ? Search : History}
                title={
                  searchQuery
                    ? "No Matching Transactions"
                    : "No Transaction History"
                }
                description={
                  searchQuery
                    ? "Try adjusting your search terms or clear the search to see all transactions."
                    : "Your transaction history will appear here once you start making trades or transfers."
                }
                hasSearchBar={true}
              >
                {!searchQuery && (
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to="/swap">Make Your First Trade</Link>
                  </Button>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="space-y-2">
              {currentTransactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors animate-in fade-in-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{tx.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {sutils.shortenTxHash(tx.hash)}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={lib.core.explorerUrl.tx(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t px-6 py-4">
          <nav
            aria-label="Transactions pagination"
            className="flex items-center justify-center"
          >
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
                aria-label="Previous page"
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || isLoading}
                aria-label="Next page"
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
