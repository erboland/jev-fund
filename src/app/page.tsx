import { Dashboard } from "@/components/dashboard";
import { currentSnapshot } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await currentSnapshot();
  return <Dashboard initial={initial} />;
}
