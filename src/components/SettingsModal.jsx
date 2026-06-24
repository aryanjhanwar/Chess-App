import { toAssetPath } from '../utils/assetPath.js';
import {
  BACKGROUND_OPTIONS,
  BOARD_COLOR_THEMES,
  DEFAULT_BOARD_SURFACE_OPTIONS,
  PIECE_SET_OPTIONS,
  THEME_PRESETS,
} from '../constants/uiPresets.js';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  uiSettingsAtom,
  applyUiSettingsAtom,
  applyThemePresetAtom,
  resetVisualSettingsAtom
} from '../state/themeState.js';

function Section({ icon, title, children, action }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white/90">
          <span aria-hidden="true" className="text-base">{icon}</span>
          {title}
        </h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-left transition hover:border-cyan-300/40 hover:bg-black/30"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {hint ? <p className="text-xs text-white/60">{hint}</p> : null}
        </div>
        <span className={`relative inline-flex h-6 w-11 rounded-full p-0.5 transition ${checked ? 'bg-cyan-400' : 'bg-white/25'}`}>
          <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </span>
      </div>
    </button>
  );
}

function PiecePreview({ setName }) {
  const fallbackChain = [
    toAssetPath(`piece/${setName}/wK.svg`),
    toAssetPath(`piece/${setName}/wK.png`),
    toAssetPath(`piece/${setName}/wk.svg`),
    toAssetPath(`piece/${setName}/wk.png`),
    toAssetPath(`piece/${setName}/wK.webp`),
    toAssetPath(`piece/${setName}/wk.webp`),
  ];

  return (
    <img
      src={fallbackChain[0]}
      alt={setName}
      className="h-8 w-8 object-contain"
      loading="lazy"
      onError={(event) => {
        const element = event.currentTarget;
        const currentTry = Number(element.dataset.fallbackTry || 0);
        if (currentTry >= fallbackChain.length - 1) return;
        const nextTry = currentTry + 1;
        element.dataset.fallbackTry = String(nextTry);
        element.src = fallbackChain[nextTry];
      }}
    />
  );
}

export default function SettingsModal({
  onClose,
  boardSurfaceOptions,
  pieceSetOptions,
}) {
  const uiSettings = useAtomValue(uiSettingsAtom);
  const onUiSettingsChange = useSetAtom(applyUiSettingsAtom);
  const onApplyThemePreset = useSetAtom(applyThemePresetAtom);
  const onResetVisualSettings = useSetAtom(resetVisualSettingsAtom);

  const applyPartial = (patch) => onUiSettingsChange?.(patch);
  const resolvedBoardSurfaceOptions = Array.isArray(boardSurfaceOptions) && boardSurfaceOptions.length
    ? boardSurfaceOptions
    : DEFAULT_BOARD_SURFACE_OPTIONS;
  const resolvedPieceSetOptions = Array.isArray(pieceSetOptions) && pieceSetOptions.length
    ? pieceSetOptions
    : PIECE_SET_OPTIONS;

  const activeThemeLabel = uiSettings.appThemePreset === 'custom'
    ? 'Custom'
    : THEME_PRESETS.find((theme) => theme.id === uiSettings.appThemePreset)?.label || 'Custom';

  return (
    <div className="fixed inset-0 z-9998 flex items-end justify-center bg-black/55 px-2 pb-0 pt-6 backdrop-blur-[2px] sm:items-center sm:px-4">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close settings" />

      <div className="settings-panel relative z-10 h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-white/20 bg-linear-to-br from-[#0c2534]/95 via-[#0c3142]/95 to-[#154a5e]/90 p-4 shadow-2xl shadow-black/40 sm:h-[88vh] sm:rounded-3xl sm:p-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">Application</p>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">App Settings</h2>
            <p className="mt-1 text-sm text-white/65">Layered customization with presets and manual overrides.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 bg-white/5 p-2.5 text-white/80 transition hover:bg-white/15"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4">
          <Section
            icon="🎭"
            title="Theme Presets"
            action={<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${uiSettings.appThemePreset === 'custom' ? 'bg-amber-400/25 text-amber-200' : 'bg-cyan-400/20 text-cyan-100'}`}>{activeThemeLabel}</span>}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {THEME_PRESETS.map((preset) => {
                const active = uiSettings.appThemePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onApplyThemePreset?.(preset.id)}
                    className={`rounded-xl border p-2 text-left transition ${active ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                  >
                    <div className="mb-2 h-12 rounded-md" style={{ background: preset.swatch, backgroundSize: 'cover' }} />
                    <p className="text-xs font-semibold text-white/90">{preset.label}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-white/60">Selecting a theme updates board, pieces, and background together.</p>
          </Section>

          <Section icon="🟫" title="Board Settings">
            <div>
              <p className="mb-2 text-xs font-medium text-white/60">Board Surface (Scrollable)</p>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {resolvedBoardSurfaceOptions.map((surface) => (
                  <button
                    key={surface.id}
                    type="button"
                    onClick={() => applyPartial({ boardSurface: surface.id })}
                    className={`rounded-xl border p-2 text-left transition ${uiSettings.boardSurface === surface.id ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                  >
                    <div className="mb-2 overflow-hidden rounded-md border border-white/10">
                      {surface.image ? (
                        <img
                          src={surface.image}
                          alt={surface.label}
                          className="h-12 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-full bg-gradient-to-br from-slate-200 to-slate-500" />
                      )}
                    </div>
                    <p className="truncate text-xs font-semibold text-white/90">{surface.label}</p>
                  </button>
                ))}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-white/60">Square Colors</p>
              <div className="flex flex-wrap gap-2">
                {BOARD_COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => applyPartial({ boardTheme: theme.id })}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${uiSettings.boardTheme === theme.id ? 'bg-cyan-400 text-[#052634]' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              checked={uiSettings.useCustomBoardColors}
              onChange={(value) => applyPartial({ useCustomBoardColors: value })}
              label="Use Custom Square Colors"
              hint="When enabled, your selected light/dark colors override preset board colors."
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
                Light Square
                <input
                  type="color"
                  value={uiSettings.customLightSquare}
                  onChange={(event) => applyPartial({ customLightSquare: event.target.value })}
                  className="mt-1 h-8 w-full cursor-pointer rounded border border-white/20 bg-transparent"
                />
              </label>
              <label className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
                Dark Square
                <input
                  type="color"
                  value={uiSettings.customDarkSquare}
                  onChange={(event) => applyPartial({ customDarkSquare: event.target.value })}
                  className="mt-1 h-8 w-full cursor-pointer rounded border border-white/20 bg-transparent"
                />
              </label>
            </div>
          </Section>

          <Section icon="♟️" title="Piece Settings">
            <p className="text-xs text-white/60">All available piece styles with instant board preview.</p>
            <div className="max-h-85 overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {resolvedPieceSetOptions.map((setName) => {
                  const active = uiSettings.pieceStyle === setName;
                  return (
                    <button
                      key={setName}
                      type="button"
                      onClick={() => applyPartial({ pieceStyle: setName })}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left transition ${active ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                    >
                      <PiecePreview setName={setName} />
                      <span className="truncate text-xs font-semibold text-white/85">{setName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section icon="🌄" title="Background Settings">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {BACKGROUND_OPTIONS.map((background) => {
                const active = uiSettings.backgroundStyle === background.id;
                return (
                  <button
                    key={background.id}
                    type="button"
                    onClick={() => applyPartial({ backgroundStyle: background.id })}
                    className={`rounded-xl border p-2 text-left transition ${active ? 'border-cyan-300 bg-cyan-400/15' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                  >
                    <div className="mb-2 h-12 rounded-md" style={{ background: background.swatch, backgroundSize: 'cover' }} />
                    <p className="text-xs font-semibold text-white/90">{background.label}</p>
                    <p className="text-[11px] uppercase tracking-wide text-white/55">{background.type}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs font-medium text-white/70">Custom Solid Background</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={uiSettings.customBackgroundColor || '#17212c'}
                  onChange={(event) => applyPartial({
                    customBackgroundColor: event.target.value,
                    backgroundStyle: 'bg-custom-solid',
                  })}
                  className="h-10 w-14 cursor-pointer rounded border border-white/20 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => applyPartial({ backgroundStyle: 'bg-custom-solid' })}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${uiSettings.backgroundStyle === 'bg-custom-solid' ? 'border-cyan-300 bg-cyan-400/15 text-cyan-50' : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'}`}
                >
                  Use This Color
                </button>
              </div>
            </div>
          </Section>

          <Section
            icon="🧠"
            title="Behavior"
            action={
              <button
                type="button"
                onClick={onResetVisualSettings}
                className="rounded-lg border border-cyan-200/30 bg-cyan-400/15 px-2.5 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/25"
              >
                Reset to Default
              </button>
            }
          >
            <Toggle checked={uiSettings.showCoordinates} onChange={(value) => applyPartial({ showCoordinates: value })} label="Show Coordinates" />
            <Toggle checked={uiSettings.highlightLastMove} onChange={(value) => applyPartial({ highlightLastMove: value })} label="Last Move Highlight" />
            <Toggle checked={uiSettings.enableAnimations} onChange={(value) => applyPartial({ enableAnimations: value })} label="Enable Animations" />
            <p className="text-xs text-white/60">Theme changes set board, pieces, and background together. Manual edits switch to Custom automatically.</p>
          </Section>
        </div>

        <div className="sticky bottom-0 mt-5 border-t border-white/10 bg-linear-to-t from-[#0f2f40] to-transparent pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-[#042130] transition hover:bg-cyan-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
