"use client";
import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Brand } from "./ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="status-page">
      <Brand />
      <div className="status-code">Oops</div>
      <h1>Something went wrong.</h1>
      <p>
        Your records are safe. Try again, and if it keeps happening, reload the
        page.
        {error.digest ? ` Reference: ${error.digest}` : ""}
      </p>
      <div className="btn-row">
        <button className="btn primary" onClick={reset}>
          <RotateCcw size={16} /> Try again
        </button>
        <Link className="btn" href="/">
          Back to home
        </Link>
      </div>
    </main>
  );
}
