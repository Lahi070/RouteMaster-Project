import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  Brain, ArrowLeft, Sparkles, Route, ChevronDown, ChevronUp,
  CheckCircle, Info, Zap, MapPin, Clock, DollarSign, TrendingUp,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/Button";
import { AIDestination, DestinationExplanation } from "../types";

/* ── Colour palette ─────────────────────────────────────────────────── */
const POS_COLOR  = "#10B981"; // green  – feature pushes score UP
const NEG_COLOR  = "#EF4444"; // red    – feature pushes score DOWN
const ACCENT     = "#FF6B35";
const BLUE       = "#004E89";

/* ── Feature-name humaniser ─────────────────────────────────────────── */
const FEATURE_LABELS: Record<string, { label: string; icon: string; tip: string }> = {
  act_match_score:   { label: "Activity Match",    icon: "🎯", tip: "How well destination activities match your interests" },
  avg_pref_score:    { label: "Preference Score",  icon: "❤️", tip: "Overall alignment with your travel preferences" },
  budget_ok:         { label: "Budget Fit",         icon: "💰", tip: "Whether this destination fits within your budget" },
  has_spiritual:     { label: "Spiritual Value",    icon: "🧘", tip: "Spiritual or meditative qualities of this place" },
  has_cultural:      { label: "Cultural Value",     icon: "🏛️", tip: "Historical and cultural significance" },
  has_wildlife:      { label: "Wildlife Factor",    icon: "🐘", tip: "Nature and wildlife experiences available" },
  has_adventure:     { label: "Adventure Score",   icon: "🧗", tip: "Adventure and outdoor activity opportunities" },
  num_acts:          { label: "Activity Count",    icon: "📋", tip: "Number of activities available at this destination" },
  num_preferred:     { label: "Pref. Categories",  icon: "⭐", tip: "How many of your preference categories this covers" },
  rating:            { label: "Community Rating",  icon: "🌟", tip: "Community satisfaction score for this destination" },
  cost_norm:         { label: "Cost Efficiency",   icon: "🧾", tip: "Cost relative to other destinations (lower is better)" },
  duration_norm:     { label: "Visit Duration",    icon: "⏱️", tip: "Estimated time needed vs your available time" },
  dr_cate:           { label: "Causal Boost",      icon: "🔬", tip: "Doubly Robust causal adjustment removing popularity bias" },
  propensity_score:  { label: "Selection Bias",    icon: "⚖️", tip: "Adjusted for historical selection bias in recommendations" },
};

const humanise = (key: string) =>
  FEATURE_LABELS[key] ?? { label: key.replace(/_/g, " "), icon: "📊", tip: "" };

/* ── Confidence ring ─────────────────────────────────────────────────── */
const ConfidenceRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 72 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ACCENT}
        strokeWidth={8} strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round" className="transition-all duration-700" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" style={{ transform: `rotate(90deg)`, transformOrigin: "center" }}
        fontSize={13} fontWeight={800} fill="#1F2937">
        {(pct * 100).toFixed(0)}%
      </text>
    </svg>
  );
};

/* ── SHAP horizontal bar ─────────────────────────────────────────────── */
const SHAPBar: React.FC<{ feature: string; value: number; maxAbs: number }> = ({ feature, value, maxAbs }) => {
  const meta   = humanise(feature);
  const pct    = maxAbs > 0 ? Math.abs(value) / maxAbs : 0;
  const isPos  = value >= 0;
  const color  = isPos ? POS_COLOR : NEG_COLOR;
  const label  = isPos ? "pushes ranking UP" : "reduces ranking";

  return (
    <div className="mb-3 group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{meta.icon}</span>
          <span className="text-sm font-semibold text-gray-700">{meta.label}</span>
          {meta.tip && (
            <div className="relative hidden group-hover:block z-20">
              <div className="absolute left-0 bottom-full mb-2 w-52 bg-gray-900 text-white text-xs p-2 rounded-lg shadow-xl">
                {meta.tip}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-sm font-bold" style={{ color }}>
            {isPos ? "+" : ""}{value.toFixed(4)}
          </span>
        </div>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute top-0 h-full rounded-full"
          style={{ background: color, left: 0 }}
        />
      </div>
    </div>
  );
};

/* ── Destination card ────────────────────────────────────────────────── */
const DestCard: React.FC<{
  dest: AIDestination;
  expl: DestinationExplanation;
  idx: number;
}> = ({ dest, expl, idx }) => {
  const [open, setOpen] = useState(idx === 0);

  const maxAbs = Math.max(...expl.top_features.map(f => Math.abs(f.shap_value)), 0.0001);
  const positive = expl.top_features.filter(f => f.shap_value >= 0);
  const negative = expl.top_features.filter(f => f.shap_value <  0);

  /* Recharts diverging data */
  const rechartsData = expl.top_features.map(f => ({
    name: humanise(f.feature).label,
    pos:  f.shap_value >= 0 ?  f.shap_value : 0,
    neg:  f.shap_value <  0 ? -f.shap_value : 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-6 flex items-center gap-4 hover:bg-gray-50/60 transition-colors"
      >
        {/* Rank badge */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white
                        font-black text-lg shrink-0"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #F7B32B)` }}>
          {idx + 1}
        </div>

        {/* Name & category */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">{dest.name}</h3>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{dest.category ?? "destination"}</p>
        </div>

        {/* Confidence ring */}
        <div className="shrink-0">
          <ConfidenceRing pct={dest.confidence} size={64} />
        </div>

        {/* Causal CATE badge */}
        <div className="shrink-0 text-center hidden sm:block">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Causal Fit</p>
          <p className="text-lg font-black" style={{ color: BLUE }}>
            {dest.causal_cate >= 0 ? "+" : ""}{dest.causal_cate.toFixed(3)}
          </p>
        </div>

        {/* Expand icon */}
        <div className="shrink-0 text-gray-400">
          {open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-8 pt-2 border-t border-gray-100">

              {/* Plain-English explanation */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#004E89]/5 to-[#FF6B35]/5
                              border border-[#FF6B35]/10 flex gap-3">
                <Sparkles size={18} className="text-[#FF6B35] mt-0.5 shrink-0"/>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {expl.explanation_text}
                </p>
              </div>

              {/* Key stats mini-row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {dest.cost_lkr != null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <DollarSign size={15} className="text-[#FF6B35]"/>
                    <div>
                      <p className="text-xs text-gray-400">Cost</p>
                      <p className="text-sm font-bold">LKR {dest.cost_lkr.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {dest.visit_duration_h != null && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <Clock size={15} className="text-[#004E89]"/>
                    <div>
                      <p className="text-xs text-gray-400">Duration</p>
                      <p className="text-sm font-bold">{dest.visit_duration_h}h</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <TrendingUp size={15} className="text-[#10B981]"/>
                  <div>
                    <p className="text-xs text-gray-400">AI Score</p>
                    <p className="text-sm font-bold">{(dest.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* SHAP feature bars */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Zap size={12}/> SHAP Feature Contributions
                  <span className="ml-1 text-gray-300">— what drove this recommendation</span>
                </p>
                {expl.top_features.map(f => (
                  <SHAPBar key={f.feature} feature={f.feature} value={f.shap_value} maxAbs={maxAbs} />
                ))}
              </div>

              {/* Diverging recharts (compact, visual) */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  📊 Visual Breakdown
                </p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rechartsData} layout="vertical" margin={{ left: 8, right: 16, top: 2, bottom: 2 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6"/>
                      <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => v.toFixed(3)}/>
                      <YAxis dataKey="name" type="category" width={110}
                        tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false}/>
                      <Tooltip
                        formatter={(v: number, name: string) =>
                          [v.toFixed(5), name === "pos" ? "↑ Boosts score" : "↓ Reduces score"]
                        }
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,.1)" }}
                      />
                      <Bar dataKey="pos" stackId="a" fill={POS_COLOR} radius={[0, 6, 6, 0]} barSize={16}/>
                      <Bar dataKey="neg" stackId="b" fill={NEG_COLOR} radius={[0, 6, 6, 0]} barSize={16}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Positive / Negative badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {positive.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1">
                      <CheckCircle size={12}/> Positive Factors
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {positive.map(f => (
                        <span key={f.feature}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg font-medium border border-green-100">
                          {humanise(f.feature).icon} {humanise(f.feature).label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {negative.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                      <Info size={12}/> Limiting Factors
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {negative.map(f => (
                        <span key={f.feature}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg font-medium border border-red-100">
                          {humanise(f.feature).icon} {humanise(f.feature).label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Route-logic step ────────────────────────────────────────────────── */
const RouteStep: React.FC<{
  step: { n: number; title: string; text: string; icon: React.ReactNode; color: string };
  idx: number;
}> = ({ step, idx }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay: idx * 0.08 }}
    className="flex gap-5"
  >
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
        style={{ background: step.color }}>
        {step.icon}
      </div>
      {idx < 3 && <div className="w-0.5 flex-1 bg-gray-200 mt-3"/>}
    </div>
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: step.color }}>
          Phase {step.n}
        </span>
        <h4 className="font-bold text-gray-900 text-lg">{step.title}</h4>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed">{step.text}</p>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════════ */
/*  Main page                                                            */
/* ══════════════════════════════════════════════════════════════════════ */
const Explainability: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [tab, setTab] = useState<"destinations" | "sequence">("destinations");

  const state = (location.state ?? {}) as {
    explanations?: Record<string, DestinationExplanation>;
    destinations?: AIDestination[];
  };

  const hasRealData  = !!(state.explanations && Object.keys(state.explanations).length > 0);
  const destinations = state.destinations ?? [];

  /* Fallback demo destination when no real data */
  const fallbackDest: AIDestination = {
    name: "Mihintale Rock", confidence: 0.87, causal_cate: 0.243,
    lat: 8.35, lng: 80.51, cost_lkr: 500, visit_duration_h: 2, category: "spiritual",
  };
  const fallbackExpl: DestinationExplanation = {
    top_features: [
      { feature: "has_spiritual",   shap_value:  0.1823 },
      { feature: "avg_pref_score",  shap_value:  0.1241 },
      { feature: "budget_ok",       shap_value:  0.0987 },
      { feature: "rating",          shap_value:  0.0612 },
      { feature: "cost_norm",       shap_value: -0.0312 },
      { feature: "duration_norm",   shap_value: -0.0189 },
    ],
    explanation_text:
      "Mihintale Rock scores highly because it perfectly aligns with your spiritual preferences and " +
      "fits comfortably within your budget. Community ratings are excellent, and the site offers a " +
      "rich cultural experience that matches your stated interests. The main limiting factor is that " +
      "the entrance cost (LKR 500) is moderate relative to your available budget.",
    confidence: 0.87,
  };

  const routeSteps = [
    {
      n: 1, title: "Causal Inference",
      color: "#FF6B35",
      icon: <Brain size={20}/>,
      text: "Doubly Robust Estimation removes popularity bias. The AI adjusted predictions using propensity scores — so destinations recommended to you are genuinely suited to your profile, not just the most visited ones.",
    },
    {
      n: 2, title: "ML Scoring",
      color: "#004E89",
      icon: <Zap size={20}/>,
      text: "A Gradient Boosting model scores all Mihintale destinations against your age, gender, preferences, budget, and available time. SHAP values then reveal exactly which features drove each score.",
    },
    {
      n: 3, title: "Route Optimisation (TSP)",
      color: "#10B981",
      icon: <Route size={20}/>,
      text: "A Nearest-Neighbour Travelling Salesman heuristic orders destinations by Haversine distance. The greedy algorithm ensures you visit each site in the order that minimises total travel — saving you time and cost.",
    },
    {
      n: 4, title: "Explainability (SHAP)",
      color: "#7B2D8B",
      icon: <Sparkles size={20}/>,
      text: "Shapley values from cooperative game theory fairly distribute the prediction credit among features. This shows you not just what was recommended, but why — giving you transparency and trust in every suggestion.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">

        {/* ── Page header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #F7B32B)` }}>
                <Brain size={20} className="text-white"/>
              </div>
              <h1 className="text-3xl font-black text-gray-900">AI Explainability</h1>
            </div>
            <p className="text-gray-500 text-sm max-w-lg">
              {hasRealData
                ? "Real SHAP values from your trained Gradient Boosting model — see exactly why each destination was chosen and why the route was ordered this way."
                : "Discover the reasoning behind every recommendation. Powered by causal inference and Shapley values."}
            </p>
            {!hasRealData && (
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full
                               bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                <Info size={11}/> Demo mode — run an AI recommendation to see real data
              </span>
            )}
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft size={16} className="mr-1"/> Back
          </Button>
        </motion.div>

        {/* ── Tab bar ────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-2xl w-fit">
          {([
            { id: "destinations", label: "🎯 Destination Analysis", sub: "Why each place was chosen" },
            { id: "sequence",     label: "🗺️ Route Logic",          sub: "Why this visit order" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.id
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Destination Analysis ───────────────────────────────── */}
        {tab === "destinations" && (
          <div className="space-y-4">
            {hasRealData ? (
              destinations.map((dest, idx) => {
                const expl = state.explanations![dest.name];
                return expl ? (
                  <DestCard key={dest.name} dest={dest} expl={expl} idx={idx}/>
                ) : null;
              })
            ) : (
              /* Fallback demo card */
              <DestCard dest={fallbackDest} expl={fallbackExpl} idx={0}/>
            )}

            {/* Legend */}
            <div className="mt-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Understanding these scores
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex gap-2 items-start">
                  <span className="w-3 h-3 rounded-full bg-[#FF6B35] mt-1 shrink-0"/>
                  <div>
                    <p className="font-bold text-gray-700">Confidence %</p>
                    <p className="text-xs text-gray-400">Model's certainty this destination suits you (0–100%)</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="w-3 h-3 rounded-full bg-[#004E89] mt-1 shrink-0"/>
                  <div>
                    <p className="font-bold text-gray-700">Causal Fit (CATE)</p>
                    <p className="text-xs text-gray-400">Causally-adjusted treatment effect — bias-corrected personalisation score</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="w-3 h-3 rounded-full bg-[#10B981] mt-1 shrink-0"/>
                  <div>
                    <p className="font-bold text-gray-700">SHAP bars</p>
                    <p className="text-xs text-gray-400">Green = feature boosted this place; Red = feature reduced its score</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Route Logic ────────────────────────────────────────── */}
        {tab === "sequence" && (
          <div className="space-y-6">
            {/* Two-level explainer hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl text-white overflow-hidden relative"
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, #003065 100%)` }}
            >
              <div className="absolute right-0 top-0 opacity-10">
                <Route size={180}/>
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold tracking-widest text-white/60 uppercase mb-2">Sequence Explanation</p>
                <h2 className="text-2xl font-black mb-3">Why this visiting order?</h2>
                <p className="text-white/75 text-sm leading-relaxed max-w-xl">
                  Your route was optimised using a <strong className="text-white">Nearest-Neighbour TSP algorithm</strong>. 
                  Starting from your highest-confidence destination, each subsequent stop was chosen as 
                  the geographically closest unvisited site — minimising total travel distance while 
                  preserving the utility of your recommendations.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-4">
                  {[
                    { icon: <MapPin size={16}/>, label: "Optimisation", val: "TSP (Greedy NN)" },
                    { icon: <Route size={16}/>,  label: "Distance Metric", val: "Haversine" },
                    { icon: <Sparkles size={16}/>, label: "Bias Removal", val: "Doubly Robust" },
                  ].map(m => (
                    <div key={m.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1">
                        {m.icon} {m.label}
                      </div>
                      <p className="text-white font-bold text-sm">{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* What "sequence-level" means in plain English */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle size={20} className="text-green-600"/>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Cost-Based Sequencing</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Each subsequent stop was chosen to minimise <strong>Haversine distance</strong> from the 
                  previous one. This greedy approach guarantees you spend less time travelling between 
                  sites and more time experiencing them — keeping total trip cost lower.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                  <Zap size={20} className="text-purple-600"/>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Utility-Based Ranking</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Destinations are ranked by their <strong>AI confidence + causal CATE score</strong>. 
                  This ensures you visit the most personally-relevant site first when you're freshest, 
                  balancing your experience quality against time constraints.
                </p>
              </motion.div>
            </div>

            {/* 4-phase AI pipeline timeline */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Brain size={13}/> The 4-Phase AI Pipeline
              </p>
              {routeSteps.map((s, i) => (
                <RouteStep key={s.n} step={s} idx={i}/>
              ))}
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { label: "Model Type",      val: "Gradient Boosting", icon: "🤖" },
                { label: "Explainability",  val: "SHAP TreeExplainer",icon: "🔬" },
                { label: "Route Method",    val: "Nearest Neighbour", icon: "🧭" },
                { label: "Bias Correction", val: "Doubly Robust",     icon: "⚖️" },
              ].map(m => (
                <div key={m.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <p className="text-2xl mb-2">{m.icon}</p>
                  <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                  <p className="text-sm font-bold text-gray-800">{m.val}</p>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="mt-12 text-center">
          <Button onClick={() => navigate("/causal-recommend")} className="px-10 py-4 text-base">
            <Brain size={17} className="mr-2"/> Try a New AI Recommendation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Explainability;
