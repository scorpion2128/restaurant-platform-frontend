/**
 * Paletas disponibles:
 * - terracotta: cálida y gastronómica (predeterminada)
 * - olive: natural y artesanal
 * - navy: sobria y corporativa
 * - burgundy: elegante y tradicional
 * - teal: contemporánea y minimalista
 *
 * Para probar otra paleta, cambia únicamente el valor de ACTIVE_THEME.
 */
export const ACTIVE_THEME = 'terracotta'

/**
 * Fondos disponibles para el login:
 * - warm-architectural: cálido, sobrio y gastronómico (recomendado)
 * - linen: claro, limpio y con textura sutil
 * - split-studio: composición editorial en dos planos
 * - midnight: oscuro y elegante para mayor contraste
 * - soft-brand: usa la identidad activa de forma muy contenida
 *
 * Para probar otro fondo, cambia únicamente ACTIVE_LOGIN_BACKGROUND.
 */
export const ACTIVE_LOGIN_BACKGROUND = 'split-studio'

export const LOGIN_BACKGROUNDS = {
  'warm-architectural': {
    canvas: '#eeeae2',
    pattern: 'linear-gradient(90deg, rgba(93, 72, 52, 0.055) 1px, transparent 1px), linear-gradient(rgba(93, 72, 52, 0.055) 1px, transparent 1px)',
    patternSize: '44px 44px',
    decoration: '#d8cec0',
    decorationSoft: '#f7f4ef',
    decorationBorder: 'rgba(91, 69, 49, 0.10)',
    cardShadow: '0 28px 70px rgba(55, 43, 32, 0.16)'
  },
  linen: {
    canvas: '#f6f5f1',
    pattern: 'repeating-linear-gradient(0deg, rgba(45, 55, 65, 0.025) 0, rgba(45, 55, 65, 0.025) 1px, transparent 1px, transparent 5px)',
    patternSize: 'auto',
    decoration: '#e7e5df',
    decorationSoft: '#ffffff',
    decorationBorder: 'rgba(71, 85, 105, 0.09)',
    cardShadow: '0 24px 64px rgba(30, 41, 59, 0.13)'
  },
  'split-studio': {
    canvas: '#edf0ef',
    pattern: 'linear-gradient(112deg, rgba(22, 78, 99, 0.10) 0%, rgba(22, 78, 99, 0.10) 38%, transparent 38%, transparent 100%)',
    patternSize: 'auto',
    decoration: '#cad6d4',
    decorationSoft: '#f8faf9',
    decorationBorder: 'rgba(22, 78, 99, 0.11)',
    cardShadow: '0 28px 72px rgba(30, 55, 57, 0.16)'
  },
  midnight: {
    canvas: '#17212b',
    pattern: 'radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.055) 0, rgba(255, 255, 255, 0.055) 1px, transparent 1.5px)',
    patternSize: '28px 28px',
    decoration: '#253442',
    decorationSoft: '#1d2935',
    decorationBorder: 'rgba(255, 255, 255, 0.07)',
    cardShadow: '0 30px 80px rgba(0, 0, 0, 0.35)'
  },
  'soft-brand': {
    canvas: 'var(--primary-soft)',
    pattern: 'linear-gradient(135deg, rgba(255, 255, 255, 0.56) 0%, transparent 46%), linear-gradient(315deg, rgba(31, 41, 55, 0.045) 0%, transparent 42%)',
    patternSize: 'auto',
    decoration: 'var(--primary-border)',
    decorationSoft: 'var(--secondary-light)',
    decorationBorder: 'rgba(31, 41, 55, 0.08)',
    cardShadow: '0 28px 72px rgba(31, 41, 55, 0.15)'
  }
}

export const THEMES = {
  terracotta: {
    primary: '#c2410c', primaryDark: '#9a3412', primaryLight: '#ea580c',
    primarySoft: '#fff7ed', primaryBorder: '#fed7aa',
    secondary: '#164e63', secondaryDark: '#0f3c47', secondaryLight: '#ecfeff',
    accent: '#b45309'
  },
  olive: {
    primary: '#4d5d2a', primaryDark: '#35421c', primaryLight: '#66783a',
    primarySoft: '#f5f7ed', primaryBorder: '#d8dfbd',
    secondary: '#7c4a2d', secondaryDark: '#5c341f', secondaryLight: '#fbf3ed',
    accent: '#a16207'
  },
  navy: {
    primary: '#1e3a5f', primaryDark: '#142a46', primaryLight: '#31577f',
    primarySoft: '#f0f5fa', primaryBorder: '#c8d7e6',
    secondary: '#9a4d24', secondaryDark: '#713818', secondaryLight: '#fff4ed',
    accent: '#a16207'
  },
  burgundy: {
    primary: '#7f1d2d', primaryDark: '#5f1521', primaryLight: '#a33649',
    primarySoft: '#fff1f3', primaryBorder: '#fecdd3',
    secondary: '#3f5a4a', secondaryDark: '#2e4337', secondaryLight: '#f0f7f3',
    accent: '#9a6700'
  },
  teal: {
    primary: '#0f5c5e', primaryDark: '#0a4244', primaryLight: '#19787a',
    primarySoft: '#eefafa', primaryBorder: '#b9dede',
    secondary: '#3f4752', secondaryDark: '#29313a', secondaryLight: '#f3f4f6',
    accent: '#a45c24'
  }
}

const sharedColors = {
  bgMain: '#ffffff', bgPrimary: '#ffffff', bgSecondary: '#f7f7f5',
  bgDark: '#1e293b', bgCard: '#ffffff', bgMuted: '#f8fafc', bgHover: '#f1f5f9',
  textPrimary: '#1f2937', textSecondary: '#64748b', textLight: '#94a3b8', textWhite: '#ffffff',
  border: '#e2e8f0', borderStrong: '#cbd5e1',
  statusPending: '#b45309', statusPendingBg: '#fffbeb',
  statusPreparing: '#1d4ed8', statusPreparingBg: '#eff6ff',
  statusReady: '#047857', statusReadyBg: '#ecfdf5',
  statusDelivered: '#475569', statusDeliveredBg: '#f1f5f9',
  statusDanger: '#b91c1c', statusDangerBg: '#fef2f2',
  statusSuccess: '#047857', statusSuccessBg: '#ecfdf5'
}

const toCssVariable = (name) => `--${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`

export const applyActiveTheme = () => {
  const palette = THEMES[ACTIVE_THEME]
  const loginBackground = LOGIN_BACKGROUNDS[ACTIVE_LOGIN_BACKGROUND]
  if (!palette) throw new Error(`Paleta desconocida: ${ACTIVE_THEME}`)
  if (!loginBackground) throw new Error(`Fondo de login desconocido: ${ACTIVE_LOGIN_BACKGROUND}`)

  const root = document.documentElement
  root.dataset.theme = ACTIVE_THEME
  root.dataset.loginBackground = ACTIVE_LOGIN_BACKGROUND
  Object.entries({ ...sharedColors, ...palette, loginBackground: loginBackground.canvas, ...Object.fromEntries(
    Object.entries(loginBackground)
      .filter(([name]) => name !== 'canvas')
      .map(([name, value]) => [`login${name[0].toUpperCase()}${name.slice(1)}`, value])
  ) }).forEach(([name, value]) => {
    root.style.setProperty(toCssVariable(name), value)
  })
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.primary)
}
