import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(108,99,255,0.25) 0%, rgba(15,15,26,0) 60%)",
        }}
      />
      <div className="container flex min-h-screen flex-col">
        <div className="py-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary-soft">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">
              Scholar<span className="text-primary-soft">AI</span>
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center pb-12">{children}</div>
      </div>
    </div>
  );
}
