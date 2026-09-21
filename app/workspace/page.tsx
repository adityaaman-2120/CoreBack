import CoreBackApp from "../coreback-app";
import { requireUser } from "../session";
import { SITE } from "@/lib/site";
export const dynamic = "force-dynamic";
export const metadata = {
  title: `Workspace · ${SITE.name}`,
  robots: { index: false, follow: false },
};
export default async function Workspace() {
  return <CoreBackApp user={await requireUser("/workspace")} />;
}
