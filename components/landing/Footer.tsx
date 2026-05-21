import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-bg">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary-soft">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">
                Scholar<span className="text-primary-soft">AI</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted">
              The AI study partner that turns your lectures, slides, and notes into
              ready-to-study material.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Product</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link href="/login" className="hover:text-white">Log in</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Legal</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-muted">© {new Date().getFullYear()} ScholarAI. Built for students.</p>
      </div>
    </footer>
  );
}
