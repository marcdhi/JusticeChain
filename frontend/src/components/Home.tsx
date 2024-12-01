import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 pt-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome to JusticeChain
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          A revolutionary platform bringing transparency and efficiency to the justice system through blockchain technology
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">View Cases</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Access and track cases with complete transparency. Every case is securely stored on the Ethereum blockchain.
          </p>
          <Link 
            to="/cases" 
            className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
          >
            Browse Cases
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Submit a Case</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Submit new cases directly to the Ethereum blockchain network with ease and security.
          </p>
          {user ? (
            <Link 
              to="/create-case" 
              className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
            >
              Create New Case
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <p className="text-sm text-gray-500">Login to create a new case</p>
          )}
        </div>
      </div>
    </div>
  )
}