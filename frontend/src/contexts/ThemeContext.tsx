import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd'
import zhCN from 'antd/locale/zh_CN'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'fundadvisor-theme-mode'

interface ThemeProviderProps {
  children: React.ReactNode
}

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark'

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }

  return 'light'
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode)
  const [prefersDark, setPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // 兼容老版浏览器
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  const resolvedTheme: ResolvedTheme = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolvedTheme)
    root.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
  }, [])

  const themeConfig = useMemo<ThemeConfig>(() => {
    const isDark = resolvedTheme === 'dark'

    return {
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#1890ff',
        colorSuccess: '#f5222d',
        colorWarning: '#faad14',
        colorError: '#52c41a',
        colorInfo: '#1890ff',
        borderRadius: 8,
        wireframe: false,
      },
      components: {
        Layout: {
          bodyBg: isDark ? '#0a0a0a' : '#f5f6fa',
          headerBg: isDark ? '#141414' : '#ffffff',
          siderBg: isDark ? '#141414' : '#ffffff',
        },
        Card: {
          colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
        },
        Table: {
          colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
        },
      },
    }
  }, [resolvedTheme])

  const contextValue = useMemo<ThemeContextValue>(() => ({
    themeMode,
    resolvedTheme,
    setThemeMode,
  }), [themeMode, resolvedTheme, setThemeMode])

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
