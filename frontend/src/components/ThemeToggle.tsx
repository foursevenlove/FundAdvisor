import React, { useMemo } from 'react'
import { Button, Dropdown, type MenuProps, Space } from 'antd'
import { Monitor, Moon, Sun, Check } from 'lucide-react'

import { useTheme, type ThemeMode } from '../contexts/ThemeContext'

interface ThemeOption {
  key: ThemeMode
  label: string
  icon: React.ReactNode
}

const options: ThemeOption[] = [
  { key: 'light', label: '浅色模式', icon: <Sun size={16} /> },
  { key: 'dark', label: '暗色模式', icon: <Moon size={16} /> },
  { key: 'system', label: '跟随系统', icon: <Monitor size={16} /> },
]

const ThemeToggle: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme()

  const activeLabel = useMemo(() => {
    if (themeMode === 'system') {
      return `跟随系统 · ${resolvedTheme === 'dark' ? '暗色' : '浅色'}`
    }
    return themeMode === 'dark' ? '暗色模式' : '浅色模式'
  }, [themeMode, resolvedTheme])

  const activeIcon = useMemo(() => {
    if (themeMode === 'system') {
      return resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />
    }
    return themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />
  }, [themeMode, resolvedTheme])

  const menuItems: MenuProps['items'] = options.map(option => ({
    key: option.key,
    label: (
      <Space size="small" align="center">
        <span className="theme-option-icon">{option.icon}</span>
        <span>{option.label}</span>
        {themeMode === option.key && <Check size={14} className="theme-option-check" />}
      </Space>
    ),
  }))

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    setThemeMode(key as ThemeMode)
  }

  return (
    <Dropdown 
      menu={{ items: menuItems, onClick: handleClick, selectedKeys: [themeMode] }}
      placement="bottomRight"
      trigger={['click']}
      overlayClassName="theme-toggle-dropdown"
    >
      <Button type="text" className="theme-toggle-button" icon={activeIcon}>
        {activeLabel}
      </Button>
    </Dropdown>
  )
}

export default ThemeToggle

