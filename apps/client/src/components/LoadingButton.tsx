import { lib } from "@/lib/sdk";
import React, { useState } from "react";
import { Button } from "./ui/button";

interface Props extends React.ComponentProps<typeof Button> {
  onClick?: (
    ...args: Parameters<
      NonNullable<React.ComponentProps<typeof Button>["onClick"]>
    >
  ) => Promise<void>;
}
export function LoadingButton(props: Props) {
  const [isLoading, setIsLoading] = useState(false);
  async function handleClick(
    ...args: Parameters<NonNullable<typeof props.onClick>>
  ) {
    setIsLoading(true);
    try {
      await props.onClick?.(...args);
    } catch (e) {
      lib.toast.error(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <Button
      {...props}
      disabled={props.disabled || isLoading}
      onClick={handleClick}
    />
  );
}
