import { ButtonLink } from '@/components/ui/button';
import { highlights } from '@/features/home/lib/highlights';

export function HomeHero() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="mb-4 inline-flex rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-sm font-medium text-violet-100">
          Production Next.js 16 platform
        </p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
          Build and operate high-trust studio workflows from one OS.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          WPX Studio OS is a modern App Router foundation designed for fast iteration,
          scalable features, and polished mobile-first product experiences.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="#platform">Explore platform</ButtonLink>
          <ButtonLink href="/docs" variant="secondary">Read docs</ButtonLink>
        </div>
      </div>
      <div id="platform" className="mt-14 grid gap-4 sm:grid-cols-3">
        {highlights.map((highlight) => (
          <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur" key={highlight}>
            <h2 className="text-lg font-bold text-white">{highlight}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Structured for maintainable releases, accessible interfaces, and predictable growth.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
