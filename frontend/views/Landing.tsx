import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Shield, Map, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Landing: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&q=80&w=2000" 
            alt="Sigiriya" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#FAFAFA]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white mb-6">
              <span className="w-2 h-2 bg-[#F7B32B] rounded-full animate-pulse" />
              <span className="text-sm font-medium tracking-wide uppercase">AI-Powered Exploration</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Route <span className="text-[#F7B32B]">Master</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Explore Sri Lanka's sacred heritage and tropical wonders with personalized, AI-optimized itineraries.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button className="w-full sm:w-auto text-lg px-10 py-4 group">
                  Start Planning
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="w-full sm:w-auto text-lg text-white hover:bg-white/10 px-10 py-4">
                  Log In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Route Master?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Experience the island like never before with technology that respects tradition.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap className="text-[#FF6B35]" />}
            title="AI Recommendations"
            description="Smart destination suggestions based on your personal travel style."
          />
          <FeatureCard 
            icon={<Map className="text-[#004E89]" />}
            title="Optimized Routes"
            description="Efficient path calculation through the Pearl of the Indian Ocean."
          />
          <FeatureCard 
            icon={<Shield className="text-[#06D6A0]" />}
            title="Local Expertise"
            description="Curated cultural insights from thousands of historic heritage sites."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="p-8 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50"
  >
    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

export default Landing;