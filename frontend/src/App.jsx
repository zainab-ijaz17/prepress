import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import JobList from './pages/JobList'
import JobDetail from './pages/JobDetail'
import CreateJob from './pages/CreateJob'
import CreateLead from './pages/CreateLead'
import DRFList from './pages/DRFList'
import CreateDRF from './pages/CreateDRF'
import DRFDetail from './pages/DRFDetail'
import MRFList from './pages/MRFList'
import LoginPage from './pages/LoginPage'

function AppContent() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {user && (
        <>
          <button
            className="hamburger-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
            <div className="sidebar-header">
              <div className="app-brand">
                <div className="app-brand__mark">P</div>
                <div>
                  <h1>Prepress Approval Portal</h1>
                  <p className="app-brand__tagline">Artwork review, approvals, and production feedback</p>
                </div>
              </div>
            </div>

            <nav className="sidebar-nav">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link__icon">📊</span>
                Dashboard
              </NavLink>

              {user?.role === 'customer' && (
                <>
                  <NavLink
                    to="/leads/create"
                    className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sidebar-link__icon">➕</span>
                    Create Lead
                  </NavLink>
                  <NavLink
                    to="/drfs"
                    className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sidebar-link__icon">📄</span>
                    My DRFs
                  </NavLink>
                </>
              )}

              {user?.role === 'sales' && (
                <>
                  <NavLink
                    to="/leads/create"
                    className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sidebar-link__icon">➕</span>
                    Create Lead
                  </NavLink>
                  <NavLink
                    to="/drfs/create"
                    className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sidebar-link__icon">📄</span>
                    Create DRF
                  </NavLink>
                  <NavLink
                    to="/drfs"
                    className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sidebar-link__icon">📋</span>
                    All DRFs
                  </NavLink>
                </>
              )}


              <NavLink
                to="/jobs"
                className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link__icon">💼</span>
                Jobs
              </NavLink>

            {/* {user?.role !== 'customer' && (
                <NavLink
                  to="/jobs/create"
                  className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sidebar-link__icon">➕</span>
                  Create Job
                </NavLink>
              )} */}
            </nav>
            

            <div className="sidebar-footer">
              <div className="user-info">
                {/*<span className="user-name">{user.name}</span>*/}
                <span className="user-role">{user.role}</span>
              </div>
              <button onClick={logout} className="btn btn-secondary btn-full">Logout</button>
            </div>
          </aside>

          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        </>
      )}

      <div className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/jobs" element={user ? <JobList /> : <Navigate to="/login" replace />} />
          <Route
            path="/jobs/create"
            element={
              user ? (user.role === 'customer' ? <Navigate to="/jobs" replace /> : <CreateJob />) : <Navigate to="/login" replace />
            }
          />
          <Route path="/jobs/:id" element={user ? <JobDetail /> : <Navigate to="/login" replace />} />
          <Route path="/leads/create" element={user ? <CreateLead /> : <Navigate to="/login" replace />} />
          <Route path="/drfs" element={user ? <DRFList /> : <Navigate to="/login" replace />} />
          <Route path="/drfs/create" element={user ? <CreateDRF /> : <Navigate to="/login" replace />} />
          <Route path="/drfs/:id" element={user ? <DRFDetail /> : <Navigate to="/login" replace />} />
          <Route path="/mrf" element={user ? <MRFList /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App
