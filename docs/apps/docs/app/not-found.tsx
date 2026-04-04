import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="scrollbar-auto-hide flex h-screen overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
      <div className="m-auto flex w-full flex-col items-center justify-center px-4 py-8">
        <p className="text-6xl font-bold text-[var(--text-tertiary)]">404</p>
        <h1 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/en"
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
