import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain, MapPin, Clock, Wallet, ChevronRight, Loader2,
  AlertCircle, Sparkles, BarChart2, Route, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  CausalRecommendRequest, CausalRecommendResponse, AIDestination,
} from "../types";
import { getCausalRecommendations } from "../services/apiService";
import Button from "../components/Button";

// ── Constants ─────────────────────────────────────────────────────────────────
const PREFERENCES = [
  { id: "cultural",  label: "🏛️ Cultural",   color: "#004E89" },
  { id: "spiritual", label: "🕌 Spiritual",   color: "#7B2D8B" },
  { id: "wildlife",  label: "🌿 Wildlife",    color: "#2A9D8F" },
  { id: "adventure", label: "🏔️ Adventure",  color: "#FF6B35" },
];

const PHASE_LABELS = [
  "Phase 1: Causal inference bias removal…",
  "Phase 2: Hybrid ML model prediction…",
  "Phase 3: TSP route optimisation…",
  "Phase 4: SHAP explanations generation…",
];

const SHAP_COLORS = ["#FF6B35", "#004E89", "#F7B32B", "#06D6A0",
                     "#7B2D8B", "#E63946", "#457B9D", "#2A9D8F"];

// ── Component ─────────────────────────────────────────────────────────────────
const CausalRecommend: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [age, setAge]               = useState(28);
  const [gender, setGender]         = useState("Male");
  const [prefs, setPrefs]           = useState<string[]>(["cultural"]);
  const [budget, setBudget]         = useState(5000);
  const [timeH, setTimeH]           = useState(6);
  const [topN, setTopN]             = useState(5);

  // Result state
  const [result, setResult]         = useState<CausalRecommendResponse | null>(null);
  const [loading, setLoading]       = useState(false);
  const [phaseIdx, setPhaseIdx]     = useState(0);
  const [error, setError]           = useState<string | null>(null);
  const [selectedDest, setSelected] = useState<AIDestination | null>(null);

  const togglePref = (id: string) =>
    setPrefs(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prefs.length === 0) { setError("Select at least one preference."); return; }
    setError(null);
    setResult(null);
    setLoading(true);
    setPhaseIdx(0);

    // Simulate phase progress text
    const interval = setInterval(() =>
      setPhaseIdx(i => (i < PHASE_LABELS.length - 1 ? i + 1 : i)), 1800);

    const req: CausalRecommendRequest = {
      age, gender, preferences: prefs, budget, time: timeH, top_n: topN,
      constraints: { region: "Mihintale" },
    };

    try {
      const res = await getCausalRecommendations(req);
      setResult(res);
      setSelected(res.recommended_destinations[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI pipeline failed.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // ── SHAP chart data for selected destination ──────────────────────────────
  const shapData = selectedDest && result
    ? (result.explanations[selectedDest.name]?.top_features ?? []).map(f => ({
        name: f.feature.replace(/_/g, " "),
        value: Math.abs(f.shap_value),
        raw: f.shap_value,
      }))
    : [];

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-[#004E89]/10 text-[#004E89]
                        px-4 py-2 rounded-full text-sm font-bold mb-4 uppercase tracking-wider">
          <Brain size={16} /> Causal-Aware AI System
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#004E89] mb-3">
          Mihintale AI Recommender
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-lg">
          4-phase pipeline: causal bias removal → ML prediction → route optimisation → SHAP explanations
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Input Form ─────────────────────────────────────────────────── */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-7 self-start"
        >
          <h2 className="text-xl font-bold text-[#004E89] flex items-center gap-2">
            <Sparkles size={20} className="text-[#FF6B35]" /> Your Profile
          </h2>

          {/* Age */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Age — <span className="text-[#FF6B35]">{age}</span>
            </label>
            <input type="range" min={5} max={80} value={age}
              onChange={e => setAge(+e.target.value)}
              className="w-full accent-[#FF6B35]" />
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Gender</label>
            <div className="flex gap-3">
              {["Male", "Female"].map(g => (
                <button key={g} type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all
                    ${gender === g
                      ? "border-[#004E89] bg-[#004E89] text-white"
                      : "border-gray-200 text-gray-500 hover:border-[#004E89]"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Preferences
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCES.map(p => (
                <button key={p.id} type="button"
                  onClick={() => togglePref(p.id)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all
                    ${prefs.includes(p.id)
                      ? "text-white border-transparent"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  style={prefs.includes(p.id) ? { backgroundColor: p.color } : {}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Budget — <span className="text-[#FF6B35]">LKR {budget.toLocaleString()}</span>
            </label>
            <input type="range" min={500} max={50000} step={500} value={budget}
              onChange={e => setBudget(+e.target.value)}
              className="w-full accent-[#FF6B35]" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>LKR 500</span><span>LKR 50,000</span>
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Available Time — <span className="text-[#FF6B35]">{timeH}h</span>
            </label>
            <input type="range" min={1} max={12} value={timeH}
              onChange={e => setTimeH(+e.target.value)}
              className="w-full accent-[#FF6B35]" />
          </div>

          {/* Top N */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Destinations to recommend — <span className="text-[#FF6B35]">{topN}</span>
            </label>
            <input type="range" min={3} max={10} value={topN}
              onChange={e => setTopN(+e.target.value)}
              className="w-full accent-[#FF6B35]" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <Button type="submit" disabled={loading}
            className="w-full py-4 text-base font-bold flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="animate-spin" size={18} /> Running AI Pipeline…</>
              : <><Brain size={18} /> Get AI Recommendations</>}
          </Button>
        </motion.form>

        {/* ── Results panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {/* Loading phases */}
            {loading && (
              <motion.div key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center space-y-6">
                <Loader2 className="w-14 h-14 animate-spin text-[#FF6B35] mx-auto" />
                <div className="space-y-3">
                  {PHASE_LABELS.map((label, i) => (
                    <div key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all
                        ${i <= phaseIdx ? "bg-[#004E89]/5 text-[#004E89]" : "text-gray-300"}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${i <= phaseIdx ? "bg-[#FF6B35] text-white" : "bg-gray-100 text-gray-400"}`}>
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results */}
            {!loading && result && (
              <motion.div key="results"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: <Route size={18} />, label: "Route Distance", value: `${result.total_distance_km.toFixed(1)} km` },
                    { icon: <Wallet size={18} />, label: "Total Cost", value: `LKR ${result.total_cost_lkr.toLocaleString()}` },
                    { icon: <Clock size={18} />, label: "Est. Time", value: `${result.estimated_time_h}h` },
                  ].map(s => (
                    <div key={s.label}
                      className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 text-center">
                      <div className="flex items-center justify-center gap-1 text-[#FF6B35] mb-1">{s.icon}</div>
                      <p className="text-xs font-bold text-gray-400 uppercase">{s.label}</p>
                      <p className="text-lg font-black text-[#004E89]">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Destination cards */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6">
                  <h3 className="text-lg font-bold text-[#004E89] mb-4 flex items-center gap-2">
                    <Target size={18} className="text-[#FF6B35]" /> Top Destinations
                    <span className="ml-auto text-xs text-gray-400 font-normal">Click to inspect SHAP</span>
                  </h3>
                  <div className="space-y-3">
                    {result.recommended_destinations.map((dest, i) => {
                      const route = result.optimized_route.find(r => r.name === dest.name);
                      const isSelected = selectedDest?.name === dest.name;
                      return (
                        <motion.div key={dest.name}
                          whileHover={{ x: 4 }}
                          onClick={() => setSelected(dest)}
                          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer
                            border-2 transition-all
                            ${isSelected ? "border-[#FF6B35] bg-[#FF6B35]/5" : "border-gray-100 hover:border-gray-200"}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#004E89] text-white
                                            flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {route?.order ?? i + 1}
                            </div>
                            <div>
                              <p className="font-bold text-[#004E89]">{dest.name}</p>
                              <p className="text-xs text-gray-400 capitalize">{dest.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Confidence</p>
                              <p className="font-bold text-[#FF6B35]">{(dest.confidence * 100).toFixed(0)}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Causal</p>
                              <p className="font-bold text-[#2A9D8F]">{dest.causal_cate.toFixed(3)}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* SHAP panel */}
                {selectedDest && (
                  <motion.div
                    key={selectedDest.name}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-bold text-[#004E89] mb-1 flex items-center gap-2">
                      <BarChart2 size={18} className="text-[#FF6B35]" /> SHAP — {selectedDest.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {result.explanations[selectedDest.name]?.explanation_text}
                    </p>
                    {shapData.length > 0 ? (
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={shapData} layout="vertical"
                            margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={110}
                              tick={{ fontSize: 11, fontWeight: 700 }}
                              axisLine={false} tickLine={false} />
                            <Tooltip
                              formatter={(v: number) => [v.toFixed(5), "mean|SHAP|"]}
                              contentStyle={{ borderRadius: 12, border: "none",
                                boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                              {shapData.map((_, idx) => (
                                <Cell key={idx} fill={SHAP_COLORS[idx % SHAP_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">SHAP values not available for this destination.</p>
                    )}
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate("/route", {
                      state: {
                        aiRoute: result.optimized_route,
                        aiResult: result,
                      },
                    })}
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6
                               bg-[#004E89] text-white rounded-2xl font-bold
                               hover:bg-[#003d6e] transition-colors shadow-lg">
                    <MapPin size={18} /> View on Map
                  </button>
                  <button
                    onClick={() => navigate("/explain", {
                      state: { explanations: result.explanations, destinations: result.recommended_destinations },
                    })}
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6
                               bg-[#FF6B35] text-white rounded-2xl font-bold
                               hover:bg-[#e05a28] transition-colors shadow-lg">
                    <Brain size={18} /> AI Explainability
                  </button>
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {!loading && !result && (
              <motion.div key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-[#004E89]/5 to-[#FF6B35]/5
                           rounded-3xl border-2 border-dashed border-gray-200
                           p-16 text-center">
                <Brain size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 text-lg font-medium">
                  Fill in your profile and click&nbsp;
                  <span className="text-[#FF6B35] font-bold">Get AI Recommendations</span>
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  The 4-phase AI pipeline will run in ~2 seconds
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CausalRecommend;
