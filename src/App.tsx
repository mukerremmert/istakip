import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './shared/components/Layout'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import VehicleManagement from './modules/vehicles/views/VehicleManagement'
import CourtManagement from './modules/courts/views/CourtManagement'
import JobManagement from './modules/jobs/views/JobManagement'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobManagement />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/vehicles/add" element={<VehicleManagement />} />
          <Route path="/settings/courts/add" element={<CourtManagement />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App