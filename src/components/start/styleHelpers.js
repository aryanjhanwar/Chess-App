export const SURFACE_BG = 'rgba(255,255,255,0.12)';
export const SURFACE_BG_HOVER = 'rgba(255,255,255,0.18)';
export const SURFACE_BG_ACTIVE = 'rgba(255,255,255,0.25)';

export const REVIEW_CTRL_BG = 'rgba(0, 150, 200, 0.7)';
export const REVIEW_CTRL_BG_HOVER = 'rgba(0, 150, 200, 0.9)';
export const REVIEW_CTRL_BG_DISABLED = 'rgba(100, 100, 100, 0.5)';

export const createHoverBackgroundHandlers = (baseColor, hoverColor, enabled = true) => ({
  onMouseEnter: (e) => {
    if (!enabled) return;
    e.currentTarget.style.background = hoverColor;
  },
  onMouseLeave: (e) => {
    if (!enabled) return;
    e.currentTarget.style.background = baseColor;
  }
});

export const getTabButtonStyle = (isActive) => ({
  background: isActive ? SURFACE_BG_ACTIVE : SURFACE_BG
});

export const getReviewNavButtonStyle = (isEnabled) => ({
  background: isEnabled ? REVIEW_CTRL_BG : REVIEW_CTRL_BG_DISABLED,
  width: '52px',
  height: '52px',
  fontSize: '20px'
});
