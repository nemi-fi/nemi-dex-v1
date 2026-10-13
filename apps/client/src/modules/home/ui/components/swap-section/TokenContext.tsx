import { useCurrencies } from "@/hooks/use-currencies";
import { getCurrencyIconUrl } from "@/utils/getCurrencyIconUrl";
import type { L2Token } from "@nemi-fi/v1-sdk";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Token } from "./types";
// Define the context type
type TokenContextType = {
  selectedToken: Token;
  selectedOutputToken: Token;
  setSelectedToken: (token: Token) => void;
  setSelectedOutputToken: (token: Token) => void;
  swapTokens: () => void;
  tokens: Token[];
  tokenBalances: Record<string, string>; // Map of token id to balance
  isTokensLoading: boolean;
};

// Create the context with a default value
const TokenContext = createContext<TokenContextType | undefined>(undefined);

// Convert L2Token to our Token type without balance
const convertToToken = (l2Token: L2Token): Token => {
  const imageUrl = getCurrencyIconUrl(l2Token);
  return {
    l2Token, // Keep the original L2Token reference
    id: l2Token.address,
    name: l2Token.name || l2Token.symbol || "Unknown",
    symbol: l2Token.symbol || "???",
    logo: (
      <img
        src={imageUrl}
        alt={l2Token.symbol || "token"}
        className="w-full h-full bg-gray-100 rounded-full"
      />
    ),
    usdPrice: 0, // Default price - this would need to be fetched
  };
};

interface TokenProviderProps {
  children: ReactNode;
  initialTokenSymbols?: {
    tokenA?: string;
    tokenB?: string;
  };
  initialTokenAddresses?: {
    tokenA?: string;
    tokenB?: string;
  };
}

// Provider component
export const TokenProvider = ({
  children,
  initialTokenSymbols,
  initialTokenAddresses,
}: TokenProviderProps) => {
  // Get currencies from lib
  const currencies = useCurrencies();
  const [isTokensLoading, setIsTokensLoading] = useState(true);

  // Ref to track if we're currently swapping tokens
  const isSwappingRef = useRef(false);

  // Convert L2Tokens to our Token format - memoize to prevent recreation on every render
  const tokens = useMemo(() => currencies.map(convertToToken), [currencies]);

  // Separate state for token balances
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>(
    {},
  );

  const defaultToken = useMemo(
    () => ({
      l2Token: {} as L2Token, // Default empty L2Token
      id: "default",
      name: "Default",
      symbol: "DEF",
      logo: (
        <img
          src={getCurrencyIconUrl("DEF")}
          alt="DEF"
          className="w-full h-full bg-gray-100 rounded-full"
        />
      ),
      usdPrice: 0,
    }),
    [],
  );

  const defaultToken2 = useMemo(
    () => ({
      l2Token: {} as L2Token, // Default empty L2Token
      id: "default2",
      name: "Default 2",
      symbol: "DEF2",
      logo: (
        <img
          src={getCurrencyIconUrl("DEF2")}
          alt="DEF2"
          className="w-full h-full bg-gray-100 rounded-full"
        />
      ),
      usdPrice: 0,
    }),
    [],
  );

  const [selectedToken, setSelectedToken] = useState<Token>(defaultToken);
  const [selectedOutputToken, setSelectedOutputToken] =
    useState<Token>(defaultToken2);

  // Update selected tokens when currencies change or initial tokens are provided
  useEffect(() => {
    if (tokens.length === 0) return;

    setIsTokensLoading(false);

    let tokenAFound = false;
    let tokenBFound = false;

    // First priority: Find tokens by address if initialTokenAddresses are provided
    if (initialTokenAddresses) {
      if (initialTokenAddresses.tokenA) {
        const tokenA = tokens.find(
          (t) =>
            t.l2Token.address.toLowerCase() ===
            initialTokenAddresses.tokenA?.toLowerCase(),
        );
        if (tokenA) {
          setSelectedToken(tokenA);
          tokenAFound = true;
          console.log("Selected token A by address:", tokenA.symbol);
        }
      }

      if (initialTokenAddresses.tokenB) {
        const tokenB = tokens.find(
          (t) =>
            t.l2Token.address.toLowerCase() ===
            initialTokenAddresses.tokenB?.toLowerCase(),
        );
        if (tokenB) {
          setSelectedOutputToken(tokenB);
          tokenBFound = true;
          console.log("Selected token B by address:", tokenB.symbol);
        }
      }
    }

    // Second priority: Find tokens by symbol if initialTokenSymbols are provided and addresses didn't match
    if (initialTokenSymbols) {
      if (!tokenAFound && initialTokenSymbols.tokenA) {
        const tokenA = tokens.find(
          (t) =>
            t.symbol.toLowerCase() ===
            initialTokenSymbols.tokenA?.toLowerCase(),
        );
        if (tokenA) {
          setSelectedToken(tokenA);
          tokenAFound = true;
          console.log("Selected token A by symbol:", tokenA.symbol);
        }
      }

      if (!tokenBFound && initialTokenSymbols.tokenB) {
        const tokenB = tokens.find(
          (t) =>
            t.symbol.toLowerCase() ===
            initialTokenSymbols.tokenB?.toLowerCase(),
        );
        if (tokenB) {
          setSelectedOutputToken(tokenB);
          tokenBFound = true;
          console.log("Selected token B by symbol:", tokenB.symbol);
        }
      }
    }

    // Default selection if no matches found
    if (!tokenAFound && tokens.length > 0) {
      const firstToken = tokens[0]!;
      setSelectedToken(firstToken);

      // Also select the second token if needed and available
      if (!tokenBFound && tokens.length > 1) {
        // Make sure we don't select the same token as tokenA
        const secondToken =
          tokens.find((t) => t.id !== firstToken.id) || tokens[1];
        setSelectedOutputToken(secondToken!);
      } else if (!tokenBFound && tokens.length === 1) {
        // If there's only one token available, use it for now (this should be a rare case)
        setSelectedOutputToken(firstToken);
      }
    }
  }, [tokens, initialTokenSymbols, initialTokenAddresses]);

  // Initialize token balances only when tokens change and are valid
  useEffect(() => {
    // Skip if there are no tokens
    if (tokens.length === 0) return;

    // Skip if we already have balances for these tokens (compare by IDs)
    const existingTokenIds = Object.keys(tokenBalances);
    const newTokenIds = tokens.map((token) => token.id);

    // Only update if the token IDs have changed
    const shouldUpdate =
      newTokenIds.length !== existingTokenIds.length ||
      newTokenIds.some((id) => !existingTokenIds.includes(id));

    if (!shouldUpdate) return;

    // Otherwise, set initial balances
    const initialBalances: Record<string, string> = {};
    tokens.forEach((token) => {
      // Preserve existing balances if available
      initialBalances[token.id] = tokenBalances[token.id] || "0";
    });

    setTokenBalances(initialBalances);
  }, [tokens, tokenBalances]);

  // Token validation and selection functions
  const handleSetSelectedToken = (token: Token) => {
    // Don't allow selecting the same token for both input and output
    // unless we're in the middle of a swap operation
    if (!isSwappingRef.current && token.id === selectedOutputToken.id) {
      console.warn("Cannot select the same token for both input and output");
      return;
    }
    setSelectedToken(token);
    console.log("Selected token:", token.symbol);
  };

  const handleSetSelectedOutputToken = (token: Token) => {
    // Don't allow selecting the same token for both input and output
    // unless we're in the middle of a swap operation
    if (!isSwappingRef.current && token.id === selectedToken.id) {
      console.warn("Cannot select the same token for both input and output");
      return;
    }
    setSelectedOutputToken(token);
    console.log("Selected output token:", token.symbol);
  };

  // Simple and direct token swap function
  const swapTokens = () => {
    if (isSwappingRef.current) {
      console.warn("Swap already in progress");
      return;
    }

    console.log(
      "Swapping tokens:",
      selectedToken.symbol,
      "⟷",
      selectedOutputToken.symbol,
    );

    try {
      // Set swapping flag to true to bypass validation checks
      isSwappingRef.current = true;

      // Save current tokens to local variables
      const tokenA = selectedToken;
      const tokenB = selectedOutputToken;

      // Perform the swap directly with the state setters
      setSelectedToken(tokenB);
      setSelectedOutputToken(tokenA);

      console.log("Tokens swapped:", tokenB.symbol, "⟷", tokenA.symbol);
    } finally {
      // Make sure to reset the swapping flag even if something fails
      // Use a small timeout to ensure state updates have processed
      setTimeout(() => {
        isSwappingRef.current = false;
      }, 100);
    }
  };

  return (
    <TokenContext.Provider
      value={{
        selectedToken,
        selectedOutputToken,
        setSelectedToken: handleSetSelectedToken,
        setSelectedOutputToken: handleSetSelectedOutputToken,
        swapTokens,
        tokens,
        tokenBalances,
        isTokensLoading,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

// Custom hook to use the token context
export const useTokenContext = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
};
