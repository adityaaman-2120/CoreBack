import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand, ThemeToggle } from "./ui";
import { SITE } from "@/lib/site";

export function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="mk-header">
      <div className="mk-header-inner">
        <Brand />
        <nav className="mk-nav" aria-label="Site">
          <Link href="/#how">How it works</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#voice">Voice</Link>
          <Link href="/guide">Guide</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <div className="mk-actions">
          <ThemeToggle />
          {signedIn ? (
            <Link className="btn primary" href="/workspace">
              Open workspace <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link className="btn ghost hide-sm" href="/signin">
                Sign in
              </Link>
              <Link className="btn primary" href="/signin?mode=signup">
                Get started <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
export function MarketingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-footer-inner">
        <div className="mk-footer-brand">
          <Brand />
          <p>{SITE.tagline}</p>
        </div>
        <div className="mk-footer-cols">
          <div>
            <h4>Product</h4>
            <Link href="/#how">How it works</Link>
            <Link href="/#features">Features</Link>
            <Link href="/guide">User guide</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link href="/signin">Sign in</Link>
            <Link href="/signin?mode=signup">Create workspace</Link>
            <Link href="/workspace">Open workspace</Link>
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/privacy">Privacy & data</Link>
            <a
              href="https://www.assemblyai.com/legal/privacy-policy"
              target="_blank"
              rel="noreferrer"
            >
              AssemblyAI privacy
            </a>
          </div>
        </div>
      </div>
      <div className="mk-footer-base">
        <span>
          © {SITE.year} {SITE.name} · {SITE.owner}
        </span>
        <span>CoreBack Voice · Data on Google Cloud</span>
      </div>
    </footer>
  );
}
