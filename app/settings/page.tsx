import { Settings as SettingsIcon, Volume2, Moon, HelpCircle } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="w-full min-h-full pb-24">
      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
            Settings
          </h1>

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
        <div className="border-3 border-blue-400 bg-white/80 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            Account
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-gray-800">
              Change Username
            </button>
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-gray-800">
              Change Password
            </button>
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-gray-800">
              Email Preferences
            </button>
          </div>
        </div>

        <div className="border-3 border-purple-400 bg-white/80 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            Display
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Dark Mode</span>
              <input type="checkbox" className="w-5 h-5 accent-purple-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Animations</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-purple-600" />
            </div>
          </div>
        </div>

        <div className="border-3 border-green-400 bg-white/80 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-green-600" />
            Audio
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Sound Effects</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">Background Music</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-green-600" />
            </div>
          </div>
        </div>

        <div className="border-3 border-amber-400 bg-white/80 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            Help & Support
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-medium text-gray-800">
              How to Play
            </button>
            <button className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-medium text-gray-800">
              FAQs
            </button>
            <button className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors font-medium text-gray-800">
              Contact Support
            </button>
          </div>
        </div>

        <button className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all text-lg">
          Logout
        </button>
          </div>
        </div>
      </section>
    </div>
  )
}
