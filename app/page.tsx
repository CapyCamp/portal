import { BookOpen } from 'lucide-react'
import { DiscordLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { NftCarousel } from '@/components/NftCarousel'

export default function HomePage() {
  return (
    <div className="min-h-full w-full min-w-0">
      {/* 1. Hero – title above, image card, text + buttons below */}
      <section className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
            Welcome to CapyCamp
          </h1>

          <div
            className="relative h-[240px] overflow-hidden rounded-2xl border-3 border-amber-800 shadow-xl sm:h-[320px] sm:rounded-3xl sm:border-4 md:h-[380px] lg:h-[420px]"
            style={{
              backgroundImage: "url('/camp-hero.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 95%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl" aria-hidden>
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'hero-card-shimmer 3s ease-in-out infinite' }} />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
            <p className="text-sm font-semibold text-slate-700 sm:text-base md:text-lg">
              Adventure starts at the campfire.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <Link
                href="/lore"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-2xl border-2 border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-50 hover:shadow-md touch-manipulation sm:px-5"
              >
                <BookOpen className="h-4 w-4" />
                Read Lore
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main content below hero */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-4 sm:gap-8 sm:px-6 sm:py-6 md:py-8">
        {/* 2. NFT Carousel */}
        <NftCarousel />

        {/* 3. Join the Camp */}
        <section className="mb-4 space-y-3 sm:space-y-4">
          <h2 className="text-base font-extrabold uppercase tracking-[0.15em] text-slate-700 sm:tracking-[0.2em] sm:text-lg">
            JOIN THE CAMP
          </h2>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 px-4 py-4 shadow-[0_14px_30px_rgba(16,185,129,0.35)] sm:gap-4 sm:rounded-3xl sm:border-3 sm:px-6">
            <p className="min-w-0 flex-1 text-sm font-medium text-emerald-900 sm:text-base">
              Grab a log, pull up to the fire, and join the CapyCamp crew for updates, drops, and
              secret camp stories.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                href="https://t.co/k62DIUaX43"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-2xl bg-[#5865F2] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(88,101,242,0.7)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(88,101,242,0.85)] active:translate-y-0 touch-manipulation"
              >
                <DiscordLogoIcon className="h-4 w-4" />
                Join Discord
              </Link>
              <Link
                href="https://x.com/CapyCamp"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_22px_rgba(15,23,42,0.75)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.9)] active:translate-y-0 touch-manipulation"
              >
                <TwitterLogoIcon className="h-4 w-4" />
                Follow on X
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

