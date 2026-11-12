import Image from "next/image";
import Link from "next/link";

const previewColumns = [
  { title: "To Do", cards: ["...", "..."] },
  { title: "In Progress", cards: ["..."] },
  { title: "Done", cards: ["...", "..."] },
];

export default function HomePage() {
  return (
    <main className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Floating blurred glows in the background (decoration only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 -z-10 size-80 rounded-full bg-glow-1/60 blur-3xl animate-float"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -bottom-24 -z-10 size-96 rounded-full bg-glow-2/40 blur-3xl animate-float [animation-delay:-4s]"
      />

      <div className="flex max-w-2xl flex-col items-center gap-5 text-center">
        {/* Big logo with a soft glow behind it */}
        <div className="relative animate-fade-up">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 scale-150 rounded-full bg-glow-2/40 blur-2xl"
          />
          <Image
            src="/logo.png"
            alt="Taskly logo"
            width={61}
            height={64}
            priority
            className="drop-shadow-md dark:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt="Taskly logo"
            width={61}
            height={64}
            priority
            className="hidden drop-shadow-md dark:block"
          />
        </div>

        <span className="animate-fade-up [animation-delay:50ms] rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase backdrop-blur">
          Project management, brewed simply
        </span>

        <h1 className="animate-fade-up font-display text-6xl font-semibold tracking-tight [animation-delay:100ms] sm:text-7xl">
          <span className="text-brand-gradient animate-gradient">Taskly</span>
        </h1>

        <p className="max-w-md animate-fade-up text-lg text-muted [animation-delay:200ms]">
          Organize projects and move tasks across your Kanban board.
        </p>

        {/* Outer span fades in; inner link runs the moving gradient.
            (One element can only run one Tailwind animation class.) */}
        <span className="mt-2 animate-fade-up [animation-delay:300ms]">
          <Link
            href="/projects"
            className="relative inline-block overflow-hidden rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-on-gradient shadow-lg shadow-primary/25 animate-gradient transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            Get started
            {/* Light sweep that moves across the button */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1/3 bg-white/25 animate-shimmer"
            />
          </Link>
        </span>
      </div>

      {/* A small decorative preview of the Kanban board */}
      <div
        aria-hidden="true"
        className="mt-14 grid w-full max-w-3xl animate-fade-up grid-cols-3 gap-3 [animation-delay:450ms] sm:gap-4"
      >
        {previewColumns.map((column, columnIndex) => (
          <div
            key={column.title}
            className="rounded-2xl border border-border bg-surface/70 p-3 shadow-sm backdrop-blur"
          >
            <p className="mb-3 text-xs font-semibold text-muted">
              {column.title}
            </p>
            <div className="flex flex-col gap-2">
              {column.cards.map((card, cardIndex) => (
                <div
                  // The card text can repeat (e.g. "..."), so the key uses the
                  // card's position instead. This list never changes order.
                  key={`${column.title}-${cardIndex}`}
                  style={{
                    animationDelay: `${600 + columnIndex * 150 + cardIndex * 100}ms`,
                  }}
                  className="animate-fade-up rounded-xl border border-border bg-surface p-2.5 text-left text-xs shadow-sm transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <span className="mb-1.5 block h-1 w-8 rounded-full bg-brand-gradient" />
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
