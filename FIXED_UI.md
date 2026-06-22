# UI Bug Audit (May 26, 2026)

This file lists UI-related bugs found in the current codebase.

## Findings

1) Settings modal z-index class invalid (modal can appear behind UI)
- Location: [src/components/SettingsModal.jsx](src/components/SettingsModal.jsx#L203)
- Issue: `z-9998` is not a Tailwind class; no z-index is applied.
- Impact: Settings modal can render behind the mobile bottom bar or other overlays.
- Fix: Replace with `z-[9998]` or a valid z-index utility like `z-50`.

2) Settings modal double-applies BASE_URL to board thumbnails (breaks on subdirectory deployments)
- Location: [src/components/SettingsModal.jsx](src/components/SettingsModal.jsx#L192)
- Issue: `boardSurfaceOptions` from App are already run through `toAssetPath`, but SettingsModal calls `toAssetPath` again. With `BASE_URL` not `/`, this produces `BASE_URL/assets/BASE_URL/...`.
- Impact: Board surface thumbnails fail to load on subdirectory deployments.
- Fix: Only call `toAssetPath` when `option.image` is not already a public URL, or remove the extra mapping when options come from App.

3) Draw offer modal is not a true modal (only covers board container)
- Location: [src/components/DrawOfferModal.jsx](src/components/DrawOfferModal.jsx#L9)
- Issue: Overlay uses `absolute` instead of `fixed`, so it only covers the nearest positioned parent (board container).
- Impact: Users can still interact with the sidebar/right panel during a draw offer; on small screens the modal can be clipped.
- Fix: Change to `fixed inset-0` and ensure a high z-index.

4) Game over text assumes the player is White
- Location: [src/components/GameOverModal.jsx](src/components/GameOverModal.jsx#L16)
- Issue: Checkmate title uses `currentTurn` to show "You Won/Lost" without knowing the player side.
- Impact: Black player or multiplayer guest sees incorrect win/loss messaging.
- Fix: Pass `playerSide`/`multiplayerSide` and compute text based on that.

5) Multiplayer lobby status text is wrong when host picks Black
- Location: [src/components/MultiplayerLobbyScreen.jsx](src/components/MultiplayerLobbyScreen.jsx#L210)
- Issue: Static text says "Host is White, Joiner is Black." even when host selects black.
- Impact: Misleading UI for both host and guest.
- Fix: Render colors from `hostSide`.

6) Chat tab is visible but disabled (dead UI)
- Location: [src/components/RightPanel.jsx](src/components/RightPanel.jsx#L63)
- Issue: "Chat" shows in top options but is disabled and marked coming soon.
- Impact: Confusing for users; suggests functionality that does not exist.
- Fix: Hide until feature ships or move to a "Coming soon" area.

7) Sidebar Support item looks clickable but has no action
- Location: [src/components/Sidebar.jsx](src/components/Sidebar.jsx#L108)
- Issue: Support row uses `cursor-pointer` with no `onClick` or link.
- Impact: Dead control in the UI.
- Fix: Add a handler or remove until supported.

8) Mobile board squares are below recommended touch target size
- Location: [src/components/ChessBoardView.jsx](src/components/ChessBoardView.jsx#L81)
- Issue: Width/height uses `(100vw-2rem)/8` capped at 70px; on 360-375px screens squares are ~42-43px.
- Impact: Pieces are hard to tap on phones.
- Fix: Increase the minimum square size or reduce side padding on mobile.

9) Chessboard squares are not keyboard accessible
- Location: [src/components/ChessBoardView.jsx](src/components/ChessBoardView.jsx#L76)
- Issue: Interactive squares are `div` elements with `onClick` but no `role`, `tabIndex`, or `aria-label`.
- Impact: Keyboard and screen-reader users cannot play.
- Fix: Use `button` elements or add `role="button"`, `tabIndex=0`, ARIA labels, and key handlers.
