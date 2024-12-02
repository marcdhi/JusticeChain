import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home } from './components/Home'
import { Cases } from './components/Cases'
import { CreateCase } from './components/CreateCase'
import { OktoDashboard } from './components/OktoDashboard'
import { Button } from "./components/ui/button"
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HH } from './components/HumanHuman/HH'
import { HAI } from './components/HumanAI/HAI'
import { HH_CreateCase } from './components/HumanHuman/HH_CreateCase';
import { HAI_CreateCase } from './components/HumanAI/HAI_CreateCase';
import { EvidenceSubmission } from './components/EvidenceSubmission';
import { CaseReview } from './components/CaseReview';
import { Courtroom } from './components/Courtroom';
import { HAICase } from './components/HumanAI/HAICase';

import './App.css'

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

function NavLink({ to, children, className = '' }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link 
      to={to} 
      className={`${className} ${isActive ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 transition-all duration-200`}
    >
      {children}
    </Link>
  )
}

function AppContent() {
  const { user, login, logout } = useAuth();

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gray-50">
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
            >
              JusticeChain
            </Link>
            <div className="flex items-center gap-6">
              <NavLink to="/cases" className="font-medium">
                Cases
              </NavLink>
              {user ? (
                <>
                  {/* <Button asChild variant="default">
                    <Link to="/create-case">Create Case</Link>
                  </Button> */}
                  <Button onClick={logout} variant="outline">Logout</Button>
                </>
              ) : (
                <Button onClick={handleLogin} variant="default">Login</Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-grow w-full flex">
        <main className="flex-grow p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/create-case" element={<CreateCase mode="human-human" />} />
            <Route path="/human-human" element={<HH />} />
            <Route path="/human-ai" element={<HAI />} />
            <Route path="/human-human/create" element={<HH_CreateCase />} />
            <Route path="/human-ai/create" element={<HAI_CreateCase />} />
            <Route path="/human-human/case/:caseId/evidence" element={<EvidenceSubmission mode="human-human" role="lawyer1" />} />
            <Route path="/human-human/case/:caseId/evidence2" element={<EvidenceSubmission mode="human-human" role="lawyer2" />} />
            <Route path="/human-ai/case/:caseId/evidence" element={<EvidenceSubmission mode="human-ai" role="lawyer1" />} />
            <Route path="/human-ai/case/:caseId/ai-evidence" element={<EvidenceSubmission mode="human-ai" role="ai" />} />
            <Route path="/human-human/case/:caseId/review" element={<CaseReview mode="human-human" />} />
            <Route path="/human-ai/case/:caseId/review" element={<CaseReview mode="human-ai" />} />
            <Route path="/courtroom/:caseId" element={<Courtroom />} />
            <Route path="/hai-case/:caseId" element={<HAICase />} />
          </Routes>
        </main>
        {user && (
          <aside className="w-1/3 p-6 border-l">
            <OktoDashboard />
          </aside>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App