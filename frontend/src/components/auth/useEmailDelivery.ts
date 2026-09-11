import { useEffect, useState } from "react";
import { fetchAuthConfig } from "@/lib/account/api";

/**
 * Whether this deployment can send email — `null` until known.
 *
 * Until a sending domain is configured, the live site cannot deliver codes or
 * reset links, and every screen that would say "we emailed you" has to say
 * that instead of promising a message that will never arrive.
 */
export function useEmailDelivery(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    void fetchAuthConfig().then(({ emailDelivery }) => {
      if (live) setAvailable(emailDelivery);
    });
    return () => {
      live = false;
    };
  }, []);

  return available;
}
