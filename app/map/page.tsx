import { MapPin } from 'lucide-react'

export default function MapPage() {
  const zones: { name: string; level: string; cardClass: string; status: string }[] = [
    { name: 'Sunny Meadow', level: '1-5', cardClass: 'border-4 bg-gradient-to-r from-yellow-300 to-amber-300 p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 rounded-2xl', status: 'Unlocked' },
    { name: 'Enchanted Forest', level: '6-12', cardClass: 'border-4 bg-gradient-to-r from-green-400 to-emerald-400 p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 rounded-2xl', status: 'Unlocked' },
    { name: 'Crystal Caves', level: '13-20', cardClass: 'border-4 bg-gradient-to-r from-blue-400 to-cyan-400 p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 rounded-2xl', status: 'Unlocked' },
    { name: 'Dragon Peak', level: '21-30', cardClass: 'border-4 bg-gradient-to-r from-purple-400 to-pink-400 p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 rounded-2xl opacity-50', status: 'Locked' },
    { name: 'Sky Fortress', level: '31+', cardClass: 'border-4 bg-gradient-to-r from-indigo-400 to-blue-400 p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 rounded-2xl opacity-50', status: 'Locked' },
  ]

  return (
    <div className="w-full min-h-full pb-24">
      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            World Map
          </h1>
          <p className="text-center text-slate-600 text-base sm:text-lg">
            Explore the CapyCamp world
          </p>

          <div
            className="relative h-[420px] overflow-hidden rounded-3xl border-4 border-amber-800 shadow-xl"
            style={{
              backgroundImage: "url('/camp-hero.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
              <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'hero-card-shimmer 3s ease-in-out infinite' }} />
            </div>
          </div>

          <div className="space-y-4">
        {zones.map((zone, i) => (
          <div key={i} className={zone.cardClass}>
            <div className="flex items-center gap-4">
              <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg sm:text-xl">{zone.name}</h3>
                <p className="text-white/80 text-sm">Level {zone.level}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm ${zone.status === 'Unlocked' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
              >
                {zone.status}
              </span>
            </div>
          </div>
        ))}
          </div>
        </div>
      </section>
    </div>
  )
}
