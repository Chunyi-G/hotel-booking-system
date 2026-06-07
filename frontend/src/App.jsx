import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import NavigationBar from './components/NavigationBar'
import BookingSuccessPage from './pages/BookingSuccessPage'
import RoomHistoryPage from './pages/RoomHistoryPage'
import RoomSearchPage from './pages/RoomSearchPage'
import StaffDashboardPage from './pages/StaffDashboardPage'
import { theme } from './theme'
import './App.css'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<RoomSearchPage />} />
          <Route path="/booking-success" element={<BookingSuccessPage />} />
          <Route path="/staff-dashboard" element={<StaffDashboardPage />} />
          <Route path="/rooms/:id/history" element={<RoomHistoryPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
