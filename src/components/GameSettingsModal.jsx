function ToggleRow({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-white/12 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
    >
      <span className="text-sm font-medium text-white">{label}</span>
      <span className={`relative inline-flex h-6 w-11 rounded-full p-0.5 transition ${checked ? 'bg-cyan-400' : 'bg-white/25'}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}

import { useAtomValue, useSetAtom } from 'jotai';
import { uiSettingsAtom, applyUiSettingsAtom } from '../state/themeState';

export default function GameSettingsModal({
  onClose,
  onFlipBoard,
  onResign,
  onOfferDraw,
  canUseInGameActions,
}) {
  const uiSettings = useAtomValue(uiSettingsAtom);
  const onUiSettingsChange = useSetAtom(applyUiSettingsAtom);
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close game settings" />

      <div className="settings-panel relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-linear-to-br from-[#0f2a3b]/96 via-[#13384d]/96 to-[#0f2f40]/95 p-5 shadow-2xl shadow-black/45 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">In Match</p>
            <h2 className="text-2xl font-bold text-white">Game Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 hover:bg-white/15"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <ToggleRow
            label="Sounds"
            checked={uiSettings.soundEffects}
            onChange={(value) => onUiSettingsChange?.({ soundEffects: value })}
          />
          <ToggleRow
            label="Legal Move Dots"
            checked={uiSettings.showLegalMoveDots}
            onChange={(value) => onUiSettingsChange?.({ showLegalMoveDots: value })}
          />

          <button
            type="button"
            onClick={onFlipBoard}
            className="w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            Flip Board
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOfferDraw}
              disabled={!canUseInGameActions}
              className="rounded-lg border border-amber-200/35 bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Offer Draw
            </button>
            <button
              type="button"
              onClick={onResign}
              disabled={!canUseInGameActions}
              className="rounded-lg border border-red-300/35 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Resign
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#042130] hover:bg-cyan-300"
        >
          Done
        </button>
      </div>
    </div>
  );
}
