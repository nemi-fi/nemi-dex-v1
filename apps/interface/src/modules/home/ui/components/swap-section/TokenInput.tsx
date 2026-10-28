import {
  AmountField,
  AmountFieldSkeleton,
  amountInputClassName,
  TokenPill,
} from "#/components/ui/amount-field.js";
import { sanitizeAmountInput } from "#/lib/amount-input.js";
import { sutils } from "@nemi-fi/utils";
import { forwardRef } from "react";
import { useSwapContext } from "./SwapContext.js";
import { useTokenContext } from "./TokenContext.js";

type TokenInputProps = {
  label: string;
  inputType: "pay" | "receive";
};

export const TokenInput = forwardRef<HTMLInputElement, TokenInputProps>(
  ({ label, inputType }, ref) => {
    // TODO(security): nuke this component because it handles stuff wrong

    // Get token data from context
    const { selectedToken, selectedOutputToken, isTokensLoading } =
      useTokenContext();
    // Get swap functionality from context
    const {
      payValue,
      setPayValue,
      handleNumericInput,
      openTokenModal,
      isCalculating,
      quote,
    } = useSwapContext();

    // Determine which token and value to use based on inputType
    const token = inputType === "pay" ? selectedToken : selectedOutputToken;

    // For receive input, we want to show the quoted amount
    const displayValue =
      inputType === "pay"
        ? payValue
        : isCalculating
          ? "..." // Show loading indicator while calculating
          : quote?.amountOut
            ? sutils.formatCurrencyAmount(quote.amountOut)
            : ""; // Show quoted amount when available

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (inputType !== "pay") {
        // Ignore change events for the receive input since it's read-only
        return;
      }
      const value = sanitizeAmountInput(
        e.target.value,
        selectedToken.l2Token.decimals,
      );
      if (value !== null) {
        setPayValue(value);
      }
    };

    if (isTokensLoading) {
      return <AmountFieldSkeleton />;
    }

    return (
      <AmountField
        className={inputType === "pay" ? "cursor-text" : undefined}
        onClick={() => {
          // Only focus the input if it's the pay field (not read-only)
          if (ref && "current" in ref && ref.current && inputType === "pay") {
            ref.current.focus();
          }
        }}
      >
        <input
          ref={ref}
          placeholder="0.00"
          type="text"
          className={amountInputClassName}
          onKeyDown={handleNumericInput}
          inputMode="decimal"
          autoComplete="off"
          value={displayValue}
          onChange={handleChange}
          readOnly={inputType === "receive"}
          aria-label={`${inputType === "pay" ? "Enter" : "View"} ${label} amount`}
        />
        <TokenPill
          logo={token.logo}
          symbol={token.symbol}
          onClick={(e) => {
            e.stopPropagation();
            openTokenModal(inputType);
          }}
          aria-label={`Select ${token.name} token`}
        />
      </AmountField>
    );
  },
);

TokenInput.displayName = "TokenInput";
