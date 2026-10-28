import { lib } from "#/lib/sdk.js";
import { castArray } from "lodash-es";
import { type ReactNode, useEffect } from "react";
import { type ArrayOrSingle } from "ts-essentials";

type QueryStatus<T, E> =
  | { status: "pending" }
  | { status: "error"; error: E }
  | { status: "success"; data: T };

type Props<T, E> = {
  query: QueryStatus<T, E>;
  hide?: ArrayOrSingle<"pending" | "error">;
  error?: (err: E) => ReactNode;
  pending?: () => ReactNode;
  children: (data: T) => ReactNode;
};

export function Query<T, E>({
  query,
  hide = [],
  error,
  pending,
  children,
}: Props<T, E>) {
  const hideArray = castArray(hide);

  useEffect(() => {
    if (query.status === "error") lib.toast.error(query.error);
  }, [query]);

  if (query.status === "pending") {
    if (!hideArray.includes("pending")) {
      return <>{pending ? pending() : <>Loading...</>}</>;
    }
  } else if (query.status === "error") {
    if (!hideArray.includes("error")) {
      return (
        <>{error ? error(query.error) : <>Error: {String(query.error)}</>}</>
      );
    }
  } else if (query.status === "success") {
    return <>{children(query.data)}</>;
  }

  return null;
}
