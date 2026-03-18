import { ShoppingBag } from 'lucide-react'

export default function ShopPage() {
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-16">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-8 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80">
          <ShoppingBag className="h-8 w-8 text-slate-500" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-600 sm:text-2xl">
          CapyCamp Shop
        </h1>
        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
          Coming soon
        </p>
        <p className="text-sm text-slate-500">
          Official merch, Cookies raffles, and goodies are on the way. Check back later.
        </p>
      </div>
    </div>
  )
}
