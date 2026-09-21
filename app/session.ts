import { safeReturnPath } from "@/lib/return-path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
// Identity is verified by Firebase, never by caller-supplied proxy headers.
export async function getUser() {
  const session = (await cookies()).get("__session")?.value;
  if (!session) return null;
  try {
    const user = await adminAuth().verifySessionCookie(session, true);
    return {
      userId: user.uid,
      email: user.email || "Guest workspace",
      displayName: user.name || user.email?.split("@")[0] || "Guest",
    };
  } catch {
    return null;
  }
}
export async function requireUser(returnTo: string) {
  const user = await getUser();
  if (user) return user;
  redirect(`/signin?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`);
}
