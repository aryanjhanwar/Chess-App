const MODE_CARDS = [
  {
    key: 'local',
    title: 'Local',
    subtitle: 'Play on one device with friends or against the engine.',
    cta: 'Start Local Match',
    image:
      'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1400&q=80',
    accent: 'from-emerald-400/60 via-cyan-300/45 to-transparent',
  },
  {
    key: 'multiplayer',
    title: 'Multiplayer',
    subtitle: 'Create a room, share code, and play online in real time.',
    cta: 'Open Lobby',
    image:
      'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=1400&q=80',
    accent: 'from-sky-300/70 via-indigo-300/45 to-transparent',
  },
];

export default function ModeSelectScreen({ onSelectLocal, onSelectMultiplayer }) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-linear-to-br from-[#0aa8dc] via-[#04779f] to-[#025a78] px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl animate-orb-drift" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl animate-orb-drift-delayed" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/25 bg-white/10 p-4 shadow-2xl backdrop-blur-lg sm:p-6 lg:p-8">
          <div className="mb-6 text-center sm:mb-8 animate-rise-in">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100/85">Chess Engine UI</p>
            <h1 className="mt-2 text-3xl font-black tracking-wide text-white sm:text-5xl">Choose Your Arena</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
              Pick a play mode to continue. Local drops you straight into the board. Multiplayer opens the room lobby.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {MODE_CARDS.map((card, index) => {
              const onClick = card.key === 'local' ? onSelectLocal : onSelectMultiplayer;
              return (
                <button
                  key={card.key}
                  onClick={onClick}
                  className="group relative min-h-[280px] overflow-hidden rounded-2xl border border-white/30 text-left shadow-xl transition-transform duration-300 hover:-translate-y-1.5 hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                  style={{ animation: `riseIn 520ms ease-out ${index * 120}ms both` }}
                >
                  <img
                    src={card.image}
                    alt={`${card.title} mode background`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 bg-linear-to-t ${card.accent}`} />
                  <div className="absolute inset-0 bg-black/35 transition-colors duration-300 group-hover:bg-black/20" />

                  <div className="relative flex h-full flex-col justify-end p-5 sm:p-6">
                    <div className="mb-2 inline-flex w-fit rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                      {card.key}
                    </div>
                    <h2 className="text-2xl font-black text-white sm:text-3xl">{card.title}</h2>
                    <p className="mt-2 max-w-[32ch] text-sm text-white/90 sm:text-base">{card.subtitle}</p>
                    <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 py-2 text-sm font-semibold text-white transition-all group-hover:bg-white/30">
                      {card.cta}
                      <span aria-hidden="true">-&gt;</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
