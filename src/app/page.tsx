import { Dashboard } from "@/components/dashboard";
import { currentSnapshot } from "@/lib/runtime";
import type { FundSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initial: FundSnapshot | null = null;
  let bootError: string | undefined;
  try {
    initial = await currentSnapshot();
  } catch (err) {
    bootError = err instanceof Error ? err.message : "Yahoo quotes failed";
  }
  return <Dashboard initial={initial} bootError={bootError} />;
}
