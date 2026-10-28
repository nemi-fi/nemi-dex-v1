"use client";

import { Button } from "./ui/button.js";

export function ConfirmToast({
  confirmText,
  yes = "Confirm",
  no = "Cancel",
  onResult,
}: {
  confirmText: string;
  yes?: string;
  no?: string;
  onResult: (result: boolean) => void;
}) {
  return (
    <div>
      <p>{confirmText}</p>
      <Button onClick={() => onResult(true)}>{yes}</Button>
      <Button variant="outline" onClick={() => onResult(false)}>
        {no}
      </Button>
    </div>
  );
}
