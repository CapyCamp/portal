export default function LorePage() {
  return (
    <div className="w-full min-h-full pb-24">
      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-center text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            The Story of CapyCamp
          </h1>
          <p className="text-center text-base text-white font-medium sm:text-lg">
            Five chapters of lore, mystery, and community. Read on to discover where the
            Scout universe is heading.
          </p>
          <p className="text-center text-white text-sm sm:text-base leading-relaxed">
            CapyCamp isn&apos;t just an NFT collection. It&apos;s an expanding universe with
            real lore, genuine stakes, and a community that&apos;s shaping its future.
          </p>
          <p className="text-center text-white text-sm sm:text-base leading-relaxed">
            Below is the official story as it unfolds. Each chapter represents a phase of
            CapyCamp&apos;s evolution. As new Scouts join and the community grows, the story
            branches into countless personal narratives.
          </p>

          <div
            className="relative h-[420px] overflow-hidden rounded-3xl border-4 border-amber-800 shadow-xl"
            style={{
              backgroundImage: "url('/lorecapy.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
              <div className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/25 to-transparent" style={{ animation: 'hero-card-shimmer 3s ease-in-out infinite' }} />
            </div>
          </div>

          <div className="mx-auto max-w-2xl space-y-10">
        {/* Chapter 1 */}
        <section className="rounded-2xl border-4 border-amber-300 bg-linear-to-br from-amber-50/90 via-sky-50/70 to-emerald-50/90 p-5 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.2)]">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Chapter 1
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              The Camp Opens
            </h2>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              The clearing appears
            </p>
          </div>
          <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
            <p>
              A clearing appears where no clearing should exist: half in the internet, half
              in someone&apos;s suspiciously convenient imagination.
            </p>
            <p>
              One second it&apos;s empty. The next? A fully-formed camp sign is hammered into
              the ground like it&apos;s been there forever:
            </p>
            <p className="font-semibold text-slate-800 pl-4 border-l-4 border-amber-400">
              CAPYCAMP (No refunds. No explanations. No running.)
            </p>
            <p>
              There are tents - too perfect to trust. There&apos;s a path - too inviting to be
              safe. And there&apos;s a lake that reflects the sky incorrectly, like it&apos;s
              rendering the wrong timeline on purpose.
            </p>
            <p>Then the first Scouts arrive.</p>
            <p>
              Not on foot. Not by wagon. Not by anything normal.
            </p>
            <p>
              They arrive as 3,333 little glitches in reality, each holding a mint like
              it&apos;s a ticket, a key, and a mildly irresponsible decision all at once. The
              mint doesn&apos;t just give them an NFT. It gives them a camp identity - a
              membership card to a place that technically shouldn&apos;t exist... but behaves
              like it absolutely does.
            </p>
            <p>The welcoming committee is already there.</p>
            <p>
              A line of capybaras stand at the entrance wearing counselor whistles and
              expressions that say:
            </p>
            <p className="font-medium italic text-slate-800">
              We were told to &apos;act professional&apos; but nobody here can read.
            </p>
            <p>
              One capy holds a clipboard upside down. Another one stamps wrists with an ink
              pad that says &quot;TRUSTED (probably)&quot;. A third capy - clearly the operations
              lead - has a lanyard that just says &quot;ELDER???&quot; with three question marks,
              like they printed the title before HR approved it.
            </p>
            <p>
              The Scouts step in. The air smells like pine needles, marshmallows, and
              absolutely minimal oversight.
            </p>
            <p>
              A counselor clears their throat and begins the camp orientation:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cabins? None. Too structured.</li>
              <li>Tents? Yes. But the tents are alive in a &quot;don&apos;t talk about it&quot; way.</li>
              <li>Rules? Also none. But somehow you will still break them.</li>
              <li>Safety? A vibe, not a policy.</li>
            </ul>
            <p>
              Someone asks, &quot;So what is CapyCamp exactly?&quot;
            </p>
            <p>
              The counselors exchange glances like they weren&apos;t told that part.
            </p>
            <p>
              Finally, the Elder with the &quot;ELDER???&quot; badge steps forward and says:
            </p>
            <p className="font-semibold text-slate-800 pl-4 border-l-4 border-sky-400">
              CapyCamp is a community. A story. A living campfire.<br />
              And also a logistical nightmare.<br />
              Congratulations. You are early.
            </p>
            <p>
              The Scouts build the first campfire - no matches, no flint, no reason. It
              just ignites when enough people believe in it. The fire crackles like a group
              chat. Someone starts telling a story. Someone else swears they heard the
              forest laugh.
            </p>
            <p>
              And as the night settles in, the camp sign flickers once, like it&apos;s
              updating.
            </p>
            <p className="font-bold text-slate-900 pl-4 border-l-4 border-emerald-500">
              CAPYCAMP: PHASE ONE IS LIVE. GOOD LUCK, SCOUTS. YOU&apos;LL NEED IT.
            </p>
          </div>
        </section>

        {/* Chapters 2–5 Coming Soon */}
        {[
          { num: 2, title: 'The Scout Oath', subtitle: 'The pledge gets weird' },
          { num: 3, title: 'Mystery Forest', subtitle: 'The forest watches back' },
          { num: 4, title: 'Elders, Counselors & Rival Troops', subtitle: 'Roles without ranks' },
          { num: 5, title: 'The Great Glampening', subtitle: 'The camp goes IRL' },
        ].map(({ num, title, subtitle }) => (
          <section
            key={num}
            className="rounded-2xl border-3 border-slate-200 bg-slate-50/90 p-5 sm:p-6 shadow-md"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Chapter {num}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-1">{title}</h2>
            <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>
            <p className="mt-3 text-slate-500 font-medium italic">Coming soon.</p>
          </section>
        ))}
          </div>
        </div>
      </section>
    </div>
  )
}
