import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home } from './components/Home'
import { Cases } from './components/Cases'
import { CreateCase } from './components/CreateCase'
import { Button } from "./components/ui/button"

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

function App() {
  return (
    <BrowserRouter>
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
                <Button asChild variant="default">
                  <Link to="/create-case">Create Case</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/create-case" element={<CreateCase />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App