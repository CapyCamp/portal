import { Zap } from 'lucide-react'

export default function MissionsPage() {
  const missions = [
    { id: 1, title: 'Defeat 5 Forest Creatures', reward: 250, progress: '3/5', status: 'in-progress', difficulty: 'Easy' },
    { id: 2, title: 'Collect 10 Golden Coins', reward: 500, progress: '7/10', status: 'in-progress', difficulty: 'Medium' },
    { id: 3, title: 'Complete a Quest Chain', reward: 1000, progress: '1/3', status: 'in-progress', difficulty: 'Hard' },
    { id: 4, title: 'Visit All Zones', reward: 800, progress: '3/5', status: 'locked', difficulty: 'Medium' },
  ]

  return (
    <div className="w-full min-h-full pb-24">
      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            Missions
          </h1>
          <p className="text-center text-slate-600 text-base sm:text-lg">
            Epic quests await
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

          <div className="mx-auto max-w-2xl space-y-4">
        {missions.map((mission) => (
          <div key={mission.id} className={`border-4 p-6 rounded-xl ${mission.status === 'locked' ? 'border-gray-300 opacity-50' : mission.status === 'in-progress' ? 'border-sky-400 bg-sky-50' : 'border-green-400 bg-green-50'}`}>
            <div className="flex items-start gap-4">
              <Zap className={`w-6 h-6 flex-shrink-0 mt-1 ${mission.status === 'locked' ? 'text-gray-400' : 'text-amber-500'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{mission.title}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${mission.difficulty === 'Easy' ? 'bg-green-200 text-green-800' : mission.difficulty === 'Medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                    {mission.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Progress: {mission.progress}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-sky-400 to-cyan-400 h-2 rounded-full" style={{ width: `${(parseInt(mission.progress.split('/')[0]) / parseInt(mission.progress.split('/')[1])) * 100}%` }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-amber-600 text-lg">{mission.reward}</div>
                <div className="text-xs text-gray-600">XP</div>
              </div>
            </div>
          </div>
        ))}
          </div>
        </div>
      </section>
    </div>
  )
}
