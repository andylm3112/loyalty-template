import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ClienteHome from './components/ClienteHome'
import AdminLoginPage from './components/AdminLoginPage'
import AdminPanel from './components/AdminPanel'
import ScanPage from './components/ScanPage'
import HechoPorTavra from './components/HechoPorTavra'
import { COLOR_FONDO } from './config'

// Insignia clara u oscura según la luminosidad del fondo del negocio
const [r, g, b] = [1, 3, 5].map((i) => parseInt(COLOR_FONDO.slice(i, i + 2), 16) || 0)
const TONO_INSIGNIA = r * 0.299 + g * 0.587 + b * 0.114 > 150 ? 'claro' : 'oscuro'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClienteHome />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/scan/:clienteId" element={<ScanPage />} />
      </Routes>
      <footer className="relative z-10 flex justify-center py-4">
        <HechoPorTavra tono={TONO_INSIGNIA} />
      </footer>
    </BrowserRouter>
  )
}

export default App
