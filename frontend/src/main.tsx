import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import App from './App.tsx'
import './styles/index.scss'
import { ThemeProvider } from './contexts/ThemeContext'

// 配置 dayjs 中文
dayjs.locale('zh-cn')

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
})

const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)

const appTree = (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
)

if (import.meta.env.PROD) {
  root.render(<React.StrictMode>{appTree}</React.StrictMode>)
} else {
  root.render(appTree)
}
