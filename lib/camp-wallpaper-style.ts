/**
 * Shared full-bleed camp background. `center top` avoids a focal character
 * painted in the middle of the asset sitting in the viewport center when
 * using background-size: cover + default center/center.
 */
export const CAMP_WALLPAPER_BASE = {
  backgroundImage: "url('/background.png')",
  backgroundSize: 'cover' as const,
  /** Anchor top of artwork; crops excess from bottom so center-of-art moves down */
  backgroundPosition: 'center top' as const,
  backgroundRepeat: 'no-repeat' as const,
}
