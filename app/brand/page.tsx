const PARTICLE_POSITIONS = [
  { left: '5%', top: '10%', size: 2, delay: '0s', duration: '8s' },
  { left: '12%', top: '25%', size: 1, delay: '1s', duration: '10s' },
  { left: '22%', top: '8%', size: 2, delay: '2s', duration: '9s' },
  { left: '35%', top: '40%', size: 1, delay: '0.5s', duration: '11s' },
  { left: '45%', top: '15%', size: 2, delay: '3s', duration: '7s' },
  { left: '55%', top: '55%', size: 1, delay: '1.5s', duration: '12s' },
  { left: '65%', top: '22%', size: 2, delay: '2.5s', duration: '8s' },
  { left: '78%', top: '35%', size: 1, delay: '0.2s', duration: '9s' },
  { left: '88%', top: '12%', size: 2, delay: '4s', duration: '10s' },
  { left: '8%', top: '60%', size: 1, delay: '2s', duration: '11s' },
  { left: '28%', top: '70%', size: 2, delay: '1s', duration: '7s' },
  { left: '50%', top: '75%', size: 1, delay: '3.5s', duration: '9s' },
  { left: '72%', top: '65%', size: 2, delay: '0.8s', duration: '10s' },
  { left: '92%', top: '80%', size: 1, delay: '2.2s', duration: '8s' },
  { left: '15%', top: '45%', size: 1, delay: '1.8s', duration: '12s' },
  { left: '42%', top: '32%', size: 2, delay: '0.3s', duration: '9s' },
  { left: '58%', top: '48%', size: 1, delay: '2.8s', duration: '11s' },
  { left: '85%', top: '55%', size: 2, delay: '1.2s', duration: '7s' },
  { left: '6%', top: '85%', size: 1, delay: '3.2s', duration: '10s' },
  { left: '38%', top: '88%', size: 2, delay: '0.6s', duration: '8s' },
  { left: '62%', top: '92%', size: 1, delay: '2.4s', duration: '9s' },
  { left: '95%', top: '42%', size: 2, delay: '1.6s', duration: '11s' },
]

export default function BrandPage() {
  return (
    <div className="brand-page relative w-full min-h-dvh bg-black">
      {/* White floating particles - Brand page only */}
      <style>{`
        @keyframes brand-particle-float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          25% { transform: translate(8px, -15px) scale(1.1); opacity: 0.8; }
          50% { transform: translate(-6px, -28px) scale(0.95); opacity: 0.5; }
          75% { transform: translate(12px, -10px) scale(1.05); opacity: 0.7; }
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        {PARTICLE_POSITIONS.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: p.left,
              top: p.top,
              width: p.size * 4,
              height: p.size * 4,
              animation: 'brand-particle-float ease-in-out infinite',
              animationDuration: p.duration,
              animationDelay: p.delay,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      <section className="relative z-10 px-6 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            A CapyCamp Brand. A Lifestyle Choice. A Warning Label.
          </h1>
          <p className="text-center text-base font-semibold text-slate-300 italic sm:text-lg">
            If it feels too clean, it&apos;s probably not ours.
          </p>

          <div
            className="relative h-[420px] overflow-hidden rounded-3xl border-4 border-amber-800 shadow-xl"
            style={{
              backgroundImage: "url('/capybrand.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
              <div className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'hero-card-shimmer 3s ease-in-out infinite' }} />
            </div>
          </div>

          <div className="mx-auto max-w-2xl space-y-10">
        {/* What Is NO.CAP? */}
        <section className="rounded-2xl border border-white/20 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-white mb-3">
            What Is NO.CAP?
          </h2>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
            NO.CAP is the honest side of CapyCamp. It is the part that refuses to pretend,
            over-promise, or pitch at people.
          </p>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
            It is a streetwear-first culture brand backed by lore, built by the camp, and
            worn by people who do not need a tagline to feel real.
          </p>
          <blockquote className="border-l-4 border-amber-500 pl-4 py-1 text-white font-medium italic">
            &ldquo;If the capybaras say it is fine, it is probably fine.&rdquo;
          </blockquote>
        </section>

        {/* Streetwear - Not Cringe */}
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-white text-center">
            Yes. It&apos;s Streetwear. No, It&apos;s Not Cringe.
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Apparel', desc: 'Real cuts. Real quality. No fake drops.' },
              { title: 'Hats', desc: 'Caps that mean something. No gimmicks.' },
              { title: 'Collectibles', desc: 'Physical items with real weight.' },
              { title: 'Physical + Digital', desc: 'Onchain identity, offchain presence.' },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-white/20 bg-slate-800/80 p-4 shadow-md"
              >
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Streetwear? */}
        <section className="rounded-2xl border border-white/20 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-white mb-3">
            Why Streetwear?
          </h2>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-3">
            Culture lives offline. If the brand is only digital, it never becomes real.
          </p>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            NO.CAP is the uniform for builders and creatives who prefer quiet confidence
            over loud credentials.
          </p>
          <p className="mt-3 text-white font-semibold">
            Web3 without shouting &ldquo;crypto&rdquo;.
          </p>
        </section>

        {/* NO.CAP Rules */}
        <section className="rounded-2xl border border-white/20 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-white mb-4">
            NO.CAP Rules
          </h2>
          <ul className="space-y-4">
            {[
              { emoji: '🧭', title: 'Tell the Truth', body: 'No fake hype. If it\'s not ready, say it\'s not ready. The camp can handle it.' },
              { emoji: '🧢', title: 'No Cap, Literally', body: 'If it feels forced, it\'s out. If it feels clean, it stays. Simple.' },
              { emoji: '🔥', title: 'Ship, Then Speak', body: 'Announcements are earned. We prefer results over noise.' },
              { emoji: '🏕️', title: 'Lore > Marketing', body: 'The story is the product. The capybaras are watching.' },
            ].map(({ emoji, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="text-2xl shrink-0" aria-hidden>{emoji}</span>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* What's Coming */}
        <section className="rounded-2xl border border-amber-500/50 bg-slate-800/80 p-5 sm:p-6 shadow-md">
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-white mb-3">
            What&apos;s Coming
          </h2>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-2">
            We are building this carefully. The pieces will show up when they are ready,
            not when they are loud.
          </p>
          <p className="text-white font-bold">Calm down.</p>
        </section>

        {/* What NO.CAP Is NOT */}
        <section className="rounded-2xl border border-white/20 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-white mb-4">
            What NO.CAP Is NOT
          </h2>
          <ul className="space-y-2">
            {[
              'A mint page.',
              'A hype machine.',
              'A merch grab.',
              'A roadmap in disguise.',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-slate-200">
                <span className="text-red-400" aria-hidden>❌</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* NO.CAP Oath */}
        <section className="rounded-2xl border border-white/20 bg-slate-900/80 p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-extrabold uppercase tracking-widest text-white mb-4">
            NO.CAP Oath
          </h2>
          <p className="text-white text-sm sm:text-base leading-relaxed mb-4 font-medium">
            I will not fake it. I will not oversell it. I will build it with the camp, wear
            it with intent, and speak only when it matters.
          </p>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-3">
            NO.CAP isn&apos;t just something you say. It&apos;s something you wear.
          </p>
          <p className="text-white font-bold">The capybaras are watching.</p>
        </section>
          </div>
        </div>
      </section>
    </div>
  )
}
