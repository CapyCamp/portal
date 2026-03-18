import { ProfileCard } from '@/components/ProfileCard'
import { CapyNFTGallery } from '@/components/CapyNFTGallery'

export default function ProfilePage() {
  return (
    <div className="w-full min-h-full px-4 py-6 pb-24 sm:px-6 sm:py-8">
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="mb-2 text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent sm:text-4xl">
          Your CapyCamp Profile
        </h1>
        <p className="text-sm text-slate-700 sm:text-base">
          Connect your Abstract Global Wallet to unlock your on-chain identity at camp.
        </p>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <ProfileCard />
        <CapyNFTGallery />
      </div>
    </div>
  )
}
