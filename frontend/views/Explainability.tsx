
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info, Brain, Zap, ArrowLeft, Target, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const Explainability: React.FC = () => {
  const navigate = useNavigate();

  const chartData = [
    { name: 'Interest Match', value: 98, color: '#FF6B35' },
    { name: 'Rating', value: 92, color: '#004E89' },
    { name: 'Budget Fit', value: 85, color: '#F7B32B' },
    { name: 'Proximity', value: 78, color: '#06D6A0' },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-5xl mx-auto">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-[#004E89] mb-2 flex items-center">
            <Brain className="mr-4 text-[#FF6B35]" /> AI Explainability
          </h2>
          <p className="text-gray-500">Understanding why we curated this route for you.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/route')}>
          <ArrowLeft className="mr-2" /> Back to Route
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Why this destination? */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-lg flex items-center justify-center text-[#FF6B35]">
              <Target size={24} />
            </div>
            <h3 className="text-2xl font-bold">Why these recommendations?</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-gray-600 text-lg leading-relaxed">
                Our recommendation engine uses a <strong>Multi-Factor Preference Model</strong>. 
                We prioritize historical importance and cultural depth based on your selection 
                of "Cultural" and "Spiritual" styles.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-3xl font-bold text-[#FF6B35]">98%</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Interest Match</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-3xl font-bold text-[#004E89]">1.4h</p>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Avg. Travel Save</p>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>

        {/* Why this order? */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-[#004E89] p-10 rounded-3xl shadow-xl text-white"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-[#F7B32B]">
              <Award size={24} />
            </div>
            <h3 className="text-2xl font-bold">The Route Logic</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">1</div>
              <h4 className="text-lg font-bold">Geographic Grouping</h4>
              <p className="text-white/70 text-sm">We grouped sites by province to minimize travel time between major cultural hubs.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">2</div>
              <h4 className="text-lg font-bold">Temporal Optimization</h4>
              <p className="text-white/70 text-sm">Opening hours were cross-referenced to ensure you arrive when the experience is at its peak.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">3</div>
              <h4 className="text-lg font-bold">Budget Distribution</h4>
              <p className="text-white/70 text-sm">Balanced expensive entry sites with free scenic wonders to keep you within yourRs. 340k budget.</p>
            </div>
          </div>
        </motion.section>

        <div className="flex justify-center pt-8">
          <Button onClick={() => navigate('/route')} className="px-12 py-5 text-xl">
            Got it, Let's Explore!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Explainability;
