import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { lib } from "@/lib/sdk";
import { useAccount } from "@/hooks/use-account";
import { useCurrencies } from "@/hooks/use-currencies";

export function useSearchTerm() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  return {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
  };
}
