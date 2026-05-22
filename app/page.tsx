import Link from "next/link";
import {
  Mic,
  Upload,
  StickyNote,
  BookOpen,
  Brain,
  MessagesSquare,
  Check,
  Sparkles,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const features = [
  { icon: Mic, title: "Record lectures live", body: "Hit record in your browser. We'll capture and transcribe the whole class." },
  { icon: Upload, title: "Upload anything", body: "PDFs, slides, docs, audio, even photos of handwritten notes." },
  { icon: StickyNote, title: "Paste your notes", body: "Already have notes? Drop them in to combine with everything else." },
  { icon: BookOpen, title: "Smart notes", body: "Organized markdown with key terms bolded and topics grouped." },
  { icon: Brain, title: "Flashcards & quiz", body: "Active recall and spaced repetition, generated automatically." },
  { icon: MessagesSquare, title: "Chat with your lecture", body: "Ask follow-up questions; Claude has full context of your material." },
];

const steps = [
  { n: "01", title: "Record or upload", body: "Capture your lecture in-browser, or drop in slides, audio, PDFs, or photos of notes." },
  { n: "02", title: "AI processes it", body: "We transcribe audio, extract text from files, and generate your full study set in seconds." },
  { n: "03", title: "Study smarter", body: "Flashcards, quizzes, summaries, and a tutor chat are ready in one tabbed view." },
];

const testimonials = [
  { quote: "I went from re-reading slides to actively recalling material. ScholarAI is the only tool that made flashcards I actually use.", author: "Maya R., Bio major" },
  { quote: "I recorded my whole organic chem lecture and had a quiz ready before I got back to the dorm. Wild.", author: "Jordan T., Chem major" },
  { quote: "The chat tab is like having a TA at 2am. It knows exactly what was in my lecture.", author: "Aiden K., CS major" },
];

export default function LandingPage() {
  return (
    <main>
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(108,99,255,0.25) 0%, rgba(15,15,26,0) 60%)",
          }}
        />
        <div className="container relative pt-20 pb-24 text-center md:pt-28 md:pb-32">
          <Badge className="mx-auto mb-6 bg-primary/10 text-primary-soft border-primary/30">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Powered by Claude Sonnet 4
          </Badge>
          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Turn any lecture into a{" "}
            <span className="grad-text">full study set</span> in seconds
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Record live, upload slides and PDFs, paste your notes — ScholarAI turns it
            all into transcripts, smart notes, flashcards, quizzes, and a tutor chat.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted">No credit card. 3 free study sets a month.</p>

          {/* hero illustration card */}
          <div className="mx-auto mt-16 max-w-4xl">
            <Card className="glass-card overflow-hidden p-0 text-left">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="border-b border-border p-6 md:border-b-0 md:border-r">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs text-primary-soft">
                    <Mic className="h-3.5 w-3.5" /> Recording — 00:34
                  </div>
                  <div className="flex h-14 items-end gap-1">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-primary/70"
                        style={{
                          height: `${20 + Math.abs(Math.sin(i * 0.6)) * 80}%`,
                          opacity: 0.4 + Math.abs(Math.sin(i * 0.6)) * 0.6,
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted">
                    "...so the mitochondrion is often described as the powerhouse of the
                    cell, but more precisely it's where ATP synthesis through oxidative
                    phosphorylation occurs..."
                  </p>
                </div>
                <div className="p-6">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs text-accent">
                    <Sparkles className="h-3.5 w-3.5" /> Generated study set
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <BookOpen className="mt-0.5 h-4 w-4 text-primary-soft" />
                      <span><b>Smart notes</b> — Mitochondria, ATP synthesis, ETC steps</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Brain className="mt-0.5 h-4 w-4 text-primary-soft" />
                      <span><b>16 flashcards</b> + 10-question quiz</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MessagesSquare className="mt-0.5 h-4 w-4 text-primary-soft" />
                      <span><b>Tutor chat</b> ready with full lecture context</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-border/60 bg-bg">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Everything you need to study, in one place</h2>
            <p className="mt-3 text-muted">
              Six tools that work together, generated from whatever you give us.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6 transition-all hover:border-primary/40 hover:bg-cardElevated">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-border/60">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">From lecture to study set in three steps</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} className="p-8">
                <div className="mb-4 text-sm font-semibold text-primary-soft">Step {s.n}</div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-border/60 bg-bg">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Simple, student-friendly pricing</h2>
            <p className="mt-3 text-muted">Start free. Upgrade when you need more.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(["free", "student", "pro", "max"] as const).map((key) => {
              const p = PLANS[key];
              return (
                <Card
                  key={key}
                  className={cn(
                    "relative p-7",
                    p.highlight && "border-primary/60 shadow-[0_0_0_1px_rgba(108,99,255,0.4),0_20px_60px_-20px_rgba(108,99,255,0.5)]",
                  )}
                >
                  {p.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-primary/40 bg-primary text-primary-fg">
                      Most popular
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">€{p.price}</span>
                    <span className="text-sm text-muted">/mo</span>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm">
                    {p.perks.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-7 w-full" variant={p.highlight ? "default" : "secondary"}>
                    <Link href="/signup">{p.cta}</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="border-t border-border/60">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Students are studying smarter</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.author} className="p-6">
                <div className="mb-3 flex gap-1 text-warning">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-white/90">"{t.quote}"</p>
                <p className="mt-4 text-xs text-muted">— {t.author}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-bg">
        <div className="container py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold md:text-4xl">
            Ready to make studying actually work?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Join thousands of students using ScholarAI to get more out of every lecture.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/signup">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
