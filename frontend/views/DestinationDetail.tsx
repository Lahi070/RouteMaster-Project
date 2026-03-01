
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, IndianRupee, CheckCircle, Navigation } from 'lucide-react';
import { MOCK_DESTINATIONS } from '../constants';
import Button from '../components/Button';

const DestinationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dest = MOCK_DESTINATIONS.find(d => d.id === id);

  if (!dest) return <div className="pt-28 text-center">Destination not found</div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="relative h-[60vh]">
        <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-28 left-6 md:left-12 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all z-20"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="absolute bottom-12 left-6 md:left-12 right-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="bg-[#FF6B35] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">
              {dest.category}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">{dest.name}</h1>
            <div className="flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500 mr-2" /> <span className="font-bold">{dest.rating}</span> ({dest.reviewsCount} reviews)</div>
              <div className="flex items-center"><Clock className="w-5 h-5 mr-2 text-[#F7B32B]" /> {dest.duration} visit</div>
              <div className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-[#06D6A0]" /> Heritage Site</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h3 className="text-2xl font-bold text-[#004E89] mb-4">Historical Significance</h3>
            <p className="text-gray-600 text-lg leading-relaxed">{dest.description}</p>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-[#004E89] mb-6">Key Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dest.highlights.map((h, i) => (
                <div key={i} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <CheckCircle className="text-[#06D6A0] mr-3" />
                  <span className="font-medium">{h}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-[#004E89] mb-6">Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <img key={i} src={`https://picsum.photos/seed/${dest.id}-${i}/400/300`} className="rounded-2xl hover:opacity-80 transition-opacity cursor-pointer" alt="Gallery" />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-32">
            <h4 className="text-xl font-bold mb-6">Visiting Info</h4>
            
            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 flex items-center"><IndianRupee className="w-4 h-4 mr-2" /> Entry Fee</span>
                <span className="font-bold text-[#004E89]">Rs. {dest.costLKR.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-2" /> Hours</span>
                <span className="font-bold text-[#004E89]">{dest.openingHours}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 flex items-center"><Navigation className="w-4 h-4 mr-2" /> Distance</span>
                <span className="font-bold text-[#004E89]">{dest.distanceFromPrevious} away</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button className="w-full py-4 text-lg">Add to Itinerary</Button>
              <Button variant="outline" className="w-full py-4 text-lg" onClick={() => navigate('/recommendations')}>
                Back to Results
              </Button>
            </div>

            <div className="mt-8 p-4 bg-[#F7B32B]/5 border border-[#F7B32B]/20 rounded-xl">
              <p className="text-sm text-[#F7B32B] font-bold mb-1">PRO TIP</p>
              <p className="text-xs text-gray-600 italic">"Arrive before 8:00 AM to beat the crowds and enjoy the best lighting for photos."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetail;
