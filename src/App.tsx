import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useAdminStore } from '@/stores/adminStore'
import { AdminPanel } from '@/screens/AdminPanel'
import { GameScreen } from '@/screens/GameScreen'

function App() {
  const currentScreen = useAppStore((s) => s.currentScreen)
  const loadFromStorage = useAdminStore((s) => s.loadFromStorage)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  return (
    <>
      {currentScreen === 'admin' && <AdminPanel />}
      {currentScreen === 'game' && <GameScreen />}
    </>
  )
}

export default App
