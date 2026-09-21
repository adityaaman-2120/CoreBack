import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "./ui";

export const metadata = { title: "Page not found" };
export default function NotFound() {
  return (
    <main className="status-page">
      <Brand />
      <div className="status-code">404</div>
      <h1>We couldn’t find that page.</h1>
      <p>The link may be old, or the page may have moved.</p>
      <div className="btn-row">
        <Link className="btn primary" href="/">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <Link className="btn" href="/workspace">
          Open workspace
        </Link>
      </div>
    </main>
  );
}
