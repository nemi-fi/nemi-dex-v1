import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionData } from "@/lib/queries";
import { lib } from "@/lib/sdk";
import { sutils } from "@nemi-fi/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "./EmptyState";

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
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-10 pr-4 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search transactions"
          />
        </div>
      </div>

      {/* Transaction List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[...Array(3)].map((_, i) => (
                  <TransactionSkeleton key={i} />
                ))}
              </motion.div>
            ) : filteredTransactions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
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
                      <Link href="/swap">Make Your First Trade</Link>
                    </Button>
                  )}
                </EmptyState>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {currentTransactions.map((tx) => (
                  <motion.div
                    key={tx.hash}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors"
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
                      href={lib.core.explorerUrl.tx(tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
