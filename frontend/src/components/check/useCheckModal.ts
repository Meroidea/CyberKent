import { useContext } from "react";
import { CheckModalContext, type CheckModalValue } from "@/components/check/CheckModalProvider";

/**
 * The checker dialog, from any call to action inside `CheckModalProvider`.
 *
 * Throws rather than returning a no-op when the provider is missing: a button
 * that silently stops opening the checker is a defect that reaches production,
 * whereas one that fails on the first render does not.
 */
export function useCheckModal(): CheckModalValue {
  const value = useContext(CheckModalContext);

  if (!value) {
    throw new Error("useCheckModal must be used inside a CheckModalProvider");
  }

  return value;
}
