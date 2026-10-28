import { TokenIcon } from "#/components/TokenIcon.js";
import { useCurrencies } from "#/hooks/use-currencies.js";
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
import { type Token } from "./types.js";

type TokenContextType = {
  selectedToken: Token;
  selectedOutputToken: Token;
  setSelectedToken: (token: Token) => void;
  setSelectedOutputToken: (token: Token) => void;
  swapTokens: () => void;
  tokens: Token[];
  isTokensLoading: boolean;
};

const TokenContext = createContext<TokenContextType | undefined>(undefined);

const convertToToken = (l2Token: L2Token): Token => ({
  l2Token, // Keep the original L2Token reference
  id: l2Token.address,
  name: l2Token.name || l2Token.symbol || "Unknown",
  symbol: l2Token.symbol || "???",
  logo: <TokenIcon token={l2Token} />,
  usdPrice: 0, // Default price - this would need to be fetched
});

/** Stand-in shown until the currency list loads. */
const placeholderToken = (symbol: string): Token => ({
  l2Token: {} as L2Token,
  id: symbol,
  name: symbol,
  symbol,
  logo: <TokenIcon token={{ symbol, name: symbol }} />,
  usdPrice: 0,
});

const PLACEHOLDER_A = placeholderToken("DEF");
const PLACEHOLDER_B = placeholderToken("DEF2");

interface TokenProviderProps {
  children: ReactNode;
  /** Preselects the pair by address. Pass a stable (memoized) object. */
  initialTokenAddresses?: {
    tokenA?: string;
    tokenB?: string;
  };
}

export const TokenProvider = ({
  children,
  initialTokenAddresses,
}: TokenProviderProps) => {
  const currencies = useCurrencies();
  const tokens = useMemo(() => currencies.map(convertToToken), [currencies]);
  const isTokensLoading = tokens.length === 0;

  // Set while swapping so the "same token on both sides" guard doesn't block the swap
  const isSwappingRef = useRef(false);

  const [selectedToken, setSelectedToken] = useState<Token>(PLACEHOLDER_A);
  const [selectedOutputToken, setSelectedOutputToken] =
    useState<Token>(PLACEHOLDER_B);

  // Select the initial pair once the currencies load: by address when given, else the first two
  useEffect(() => {
    if (tokens.length === 0) return;

    const findByAddress = (address: string | undefined) =>
      address
        ? tokens.find(
            (t) => t.l2Token.address.toLowerCase() === address.toLowerCase(),
          )
        : undefined;

    const tokenA = findByAddress(initialTokenAddresses?.tokenA);
    const tokenB = findByAddress(initialTokenAddresses?.tokenB);

    if (tokenA) setSelectedToken(tokenA);
    if (tokenB) setSelectedOutputToken(tokenB);

    if (!tokenA) {
      const firstToken = tokens[0]!;
      setSelectedToken(firstToken);
      if (!tokenB) {
        // Avoid selecting the same token on both sides when there's a choice
        setSelectedOutputToken(
          tokens.find((t) => t.id !== firstToken.id) ?? firstToken,
        );
      }
    }
  }, [tokens, initialTokenAddresses]);

  const handleSetSelectedToken = (token: Token) => {
    if (!isSwappingRef.current && token.id === selectedOutputToken.id) {
      console.warn("Cannot select the same token for both input and output");
      return;
    }
    setSelectedToken(token);
  };

  const handleSetSelectedOutputToken = (token: Token) => {
    if (!isSwappingRef.current && token.id === selectedToken.id) {
      console.warn("Cannot select the same token for both input and output");
      return;
    }
    setSelectedOutputToken(token);
  };

  const swapTokens = () => {
    if (isSwappingRef.current) return;
    isSwappingRef.current = true;
    setSelectedToken(selectedOutputToken);
    setSelectedOutputToken(selectedToken);
    // Let the state updates land before re-enabling the guard
    setTimeout(() => {
      isSwappingRef.current = false;
    }, 100);
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
        isTokensLoading,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useTokenContext = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
};
