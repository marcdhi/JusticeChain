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
import { OktoProvider } from 'okto-sdk-react';
import { CONFIG } from './config';
import { Web3Wallet } from './components/Web3Wallet';
import { EmailAuth } from './components/EmailAuth'
import { Loader2 } from 'lucide-react'
import { useState } from 'react';

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
  const { user, login, logout, authMethod, handleEmailAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
    {/* Navbar */}
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            JusticeChain
          </Link>

          {/* Navigation Links and Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6">
              <NavLink to="/cases" className="font-medium">
                Cases
              </NavLink>
              {user && (
                <Button asChild variant="ghost">
                  <Link to="/create-case">Create Case</Link>
                </Button>
              )}
            </div>

            {/* Auth and Wallet Section */}
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <Web3Wallet />
                  <div className="h-6 w-px bg-gray-200" /> {/* Divider */}
                  <Button 
                    onClick={logout} 
                    variant="outline"
                    size="sm"
                    className="text-sm"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  variant="default"
                  size="sm"
                  className="text-sm"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>

    
    
      <main className="flex-grow container mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : authMethod === 'email' && !user ? (
          <EmailAuth onSuccess={handleEmailAuth} />
        ) : (

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
        )}
      </main>
 
    </div>
  )
}

function App() {
  return (
    <OktoProvider 
      apiKey={CONFIG.OKTO_APP_SECRET}
      buildType="SANDBOX"
    >
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </OktoProvider>
  )
}

export default App
