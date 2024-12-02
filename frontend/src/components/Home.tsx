import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

export const Home = () => {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const sponsorVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const sponsors = [
    { 
      name: "SUI", 
      icon: "⚡",
      hoverIcon: "🚀",
      gradient: "from-cyan-500 to-blue-600",
      description: "A Layer 1 blockchain with high-performance consensus and secure Move programming language, processing up to 297,000 TPS.",
      value: "Enables parallel transaction processing and secure smart contracts",
      stats: "1.8B+ TPS"
    },
    { 
      name: "Okto", 
      icon: "🛡️",
      hoverIcon: "🐙",
      gradient: "from-violet-600 to-purple-700",
      description: "Advanced institutional-grade wallet infrastructure providing secure key management.",
      value: "Powers secure digital identity and authentication",
      stats: "Enterprise Security"
    },
    { 
      name: "CAPX", 
      icon: "💎",
      hoverIcon: "📈",
      gradient: "from-blue-500 to-indigo-600",
      description: "Decentralized asset management protocol enabling transparent tokenization.",
      value: "Facilitates transparent case funding",
      stats: "Asset Platform"
    },
    { 
      name: "Nethermind", 
      icon: "🔗",
      hoverIcon: "⛓️",
      gradient: "from-emerald-500 to-teal-600",
      description: "Leading blockchain infrastructure provider with expertise in consensus mechanisms.",
      value: "Powers blockchain infrastructure",
      stats: "Tech Leader"
    },
    { 
      name: "FanTV", 
      icon: "📺",
      hoverIcon: "🎬",
      gradient: "from-red-500 to-pink-600",
      description: "Enabling video streaming capabilities for virtual court proceedings.",
      value: "Virtual court streaming",
      stats: "Media Platform"
    },
    { 
      name: "Base", 
      icon: "⚛️",
      hoverIcon: "🏗️",
      gradient: "from-blue-600 to-sky-500",
      description: "Ethereum L2 scaling solution built on OP Stack for efficient transactions.",
      value: "Scalable operations",
      stats: "L2 Solution"
    },
    { 
      name: "Bulliverse", 
      icon: "🌐",
      hoverIcon: "🐂",
      gradient: "from-orange-500 to-red-600",
      description: "Supporting metaverse integration for immersive virtual court experiences.",
      value: "Virtual environments",
      stats: "Metaverse"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white/50 to-blue-100/50 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100/20 via-transparent to-blue-50/30 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="relative">
        <motion.div 
          className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="text-center mb-20 pt-8"
            variants={itemVariants}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <h1 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                Welcome to JusticeChain
              </h1>
            </motion.div>
            <motion.p 
              className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              A revolutionary platform bringing transparency and efficiency to the justice system through blockchain technology
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {[
              {
                title: "View Cases",
                description: "Access and track cases with complete transparency. Every case is securely stored on the Ethereum blockchain.",
                link: "/cases",
                linkText: "Browse Cases",
                icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              },
              {
                title: "Submit a Case",
                description: "Submit new cases directly to the Ethereum blockchain network with ease and security.",
                link: "/create-case",
                linkText: "Create New Case",
                icon: "M12 6v6m0 0v6m0-6h6m-6 0H6"
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{card.title}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {card.description}
                </p>
                {user || card.title === "View Cases" ? (
                  <Link 
                    to={card.link}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {card.linkText}
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">Login to create a new case</p>
                )}
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Human-Human Interaction",
                description: "Traditional case handling between human parties. Perfect for standard legal proceedings and direct human interaction and AI Judge for verdicts",
                link: "/human-human",
                linkText: "Access Human-Human Module",
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              },
              {
                title: "Human-AI Interaction",
                description: "A simulated environment of Human & AI based lawyers, helping lawyers in simulating real court proceedings with the help of conversation AI Agents.",
                link: "/human-ai",
                linkText: "Access Human-AI Module",
                icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{card.title}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {card.description}
                </p>
                <Link 
                  to={card.link}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                >
                  {card.linkText}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-24 text-center"
            variants={itemVariants}
          >
            <motion.h2 
              className="text-3xl font-bold text-gray-800 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Our Technology Partners
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto mb-16">
              {sponsors.map((sponsor) => (
                <motion.div
                  key={sponsor.name}
                  className={`group relative bg-gradient-to-br ${sponsor.gradient} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden min-h-[320px]`}
                  variants={sponsorVariants}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                >
                  {/* Regular View */}
                  <div className="p-10 relative z-10 text-white group-hover:opacity-0 transition-opacity duration-300">
                    <div className="mb-8 text-center transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
                      <span className="text-6xl filter drop-shadow-lg">
                        {sponsor.icon}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{sponsor.name}</h3>
                    <div className="text-sm font-medium bg-white/20 rounded-full px-4 py-2 inline-block backdrop-blur-sm">
                      {sponsor.stats}
                    </div>
                  </div>

                  {/* Hover View */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/90 to-black/70 p-10 flex flex-col justify-center items-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                    <div className="mb-6 transform transition-transform duration-300 scale-125">
                      <span className="text-6xl filter drop-shadow-lg animate-bounce">
                        {sponsor.hoverIcon}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{sponsor.name}</h3>
                    <p className="text-base leading-relaxed mb-6 text-center">{sponsor.description}</p>
                    <div className="bg-white/20 rounded-lg px-6 py-3 backdrop-blur-sm">
                      <p className="text-sm font-medium">{sponsor.value}</p>
                    </div>
                  </div>

                  {/* Decorative Elements - made larger */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-70 group-hover:opacity-0 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-70 group-hover:opacity-0 transition-opacity duration-300" />
                </motion.div>
              ))}
            </div>

            {/* Compact Special Thanks */}
            <motion.div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 px-4 rounded-xl shadow-xl inline-block"
              variants={itemVariants}
            >
              <p className="text-sm font-medium">
                Special thanks to 
                <span className="font-bold mx-1">Unfold</span>
                &
                <span className="font-bold mx-1">CoinDCX</span>
              </p>
            </motion.div>
          </motion.div>

          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </motion.div>
      </div>
    </div>
  );
};

const styles = `
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.bg-grid-pattern {
  background-image: linear-gradient(to right, #e5e7eb 1px, transparent 1px),
    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
  background-size: 24px 24px;
}
`;
