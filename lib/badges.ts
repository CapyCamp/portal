export type BadgeDefinition = {
  slug: string
  name: string
  description: string
  image: string
  criteria: string
}

export const BADGES: BadgeDefinition[] = [
  {
    slug: 'first-day-at-camp',
    name: 'First Day at Camp',
    description: 'Show up for your very first day at CapyCamp.',
    image: '/badges/firstdayatcamp.png',
    criteria: 'Be one of the first holders',
  },
  {
    slug: 'navigator',
    name: 'Navigator',
    description: 'Find your way through the camp and keep moving forward.',
    image: '/badges/navigator.png',
    criteria: 'Unlocks after earning your First Day at Camp badge.',
  },
  {
    slug: 'own-5-nfts',
    name: 'Camp Collector',
    description: 'Own at least 5 CapyCamp NFTs.',
    image: '/badges/own-5-nfts.png',
    criteria: 'Hold 5 CapyCamp NFTs in your Abstract wallet.',
  },
  {
    slug: 'own-10-nfts',
    name: 'Capy Curator',
    description: 'Own at least 10 CapyCamp NFTs.',
    image: '/badges/own-10-nfts.png',
    criteria: 'Hold 10 CapyCamp NFTs in your Abstract wallet.',
  },
  {
    slug: 'daily-login-streak',
    name: 'Campfire Regular',
    description: 'Show up to the campfire again and again.',
    image: '/badges/daily-login-streak.png',
    criteria: 'Maintain a 7-day daily rewards streak.',
  },
  {
    slug: 'community-participation',
    name: 'Community Scout',
    description: 'Helps keep the campfire alive.',
    image: '/badges/community-participation.png',
    criteria: 'Earned through community participation in Discord and events.',
  },
]

