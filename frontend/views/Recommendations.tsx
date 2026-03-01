import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  AlertCircle,
  Star,
  Trash2,
  Bookmark,
  Check,
} from "lucide-react";
import Button from "../components/Button";
import {
  TravelRecommendation,
  RecommendationRequest,
  SavedItineraryResponse,
} from "../types";
import {
  getRecommendations,
  userAPI,
  getCombinationById,
} from "../services/apiService";
import { useAuth } from "../context/AuthContext";

const Recommendations: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<
    TravelRecommendation[]
  >([]);
  const [savedItineraries, setSavedItineraries] = useState<
    SavedItineraryResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const preferences = (
    location.state as { preferences?: RecommendationRequest }
  )?.preferences;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // If preferences provided, fetch new recommendations
      if (preferences) {
        try {
          const response = await getRecommendations(preferences);
          if (response.success) {
            console.dir(response.recommendations, { depth: null });
            setRecommendations(response.recommendations);
          } else {
            setError("Failed to fetch recommendations.");
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred while fetching recommendations.",
          );
        } finally {
          setLoading(false);
        }
        return;
      }

      // No preferences - try to load saved itineraries if authenticated
      if (isAuthenticated) {
        setLoadingSaved(true);
        try {
          const saved = await userAPI.getSavedItineraries();
          setSavedItineraries(saved);

          if (saved.length > 0) {
            // Each saved itinerary stores the full TravelRecommendation as JSON
            const converted: TravelRecommendation[] = saved.map((s) => ({
              ...s.itinerary,
              id: s.id,
              title: s.title ?? s.itinerary.title,
            }));
            setRecommendations(converted);
          } else {
            setError(
              "No saved itineraries found. Please go to preferences to get new recommendations.",
            );
          }
        } catch (err) {
          setError(
            "Failed to load saved itineraries. Please go to preferences to get new recommendations.",
          );
        } finally {
          setLoadingSaved(false);
        }
      } else {
        setError(
          "No preferences provided. Please go back and set your travel preferences.",
        );
      }

      setLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteItinerary = async (itineraryId: number) => {
    try {
      await userAPI.deleteItinerary(itineraryId);
      setSavedItineraries((prev) => prev.filter((it) => it.id !== itineraryId));
      // Also remove the corresponding recommendation if loaded from saved
      if (!preferences) {
        const deletedItinerary = savedItineraries.find(
          (it) => it.id === itineraryId,
        );
        if (deletedItinerary) {
          setRecommendations((prev) =>
            prev.filter((rec) => rec.id !== deletedItinerary.combinationId),
          );
        }
      }
    } catch (err) {
      console.error("Failed to delete itinerary:", err);
    }
  };

  const isShowingSavedItineraries = !preferences && recommendations.length > 0;
  const totalDays =
    preferences?.days ||
    (recommendations.length > 0 ? recommendations[0].days : 0);
  const totalCost =
    recommendations.length > 0 ? recommendations[0].estimated_cost.total : 0;
  const styleNames =
    preferences?.travelStyles?.join(", ") ||
    (recommendations.length > 0
      ? recommendations[0].travel_styles.join(", ")
      : "your preferences");

  if (loading || loadingSaved) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF6B35] mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {loadingSaved
              ? "Loading your saved itineraries..."
              : "Finding the best itineraries for you..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 text-lg mb-4">{error}</p>
          <Link to="/preferences">
            <Button>Go to Preferences</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[#004E89] mb-2">
            {isShowingSavedItineraries
              ? "Your Saved Itineraries"
              : "Your Travel Plans"}
          </h2>
          <p className="text-gray-500">
            {isShowingSavedItineraries
              ? "Previously saved travel plans from your account."
              : `Based on your love for ${styleNames}.`}
          </p>
          {isShowingSavedItineraries && (
            <Link to="/preferences" className="mt-3 inline-block">
              <Button variant="ghost" className="text-sm">
                Get New Recommendations →
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-4 glass p-2 rounded-2xl shadow-sm border border-gray-100">
          {!isShowingSavedItineraries && (
            <div className="px-6 border-r border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase">
                Total Days
              </p>
              <p className="text-xl font-bold text-[#FF6B35]">
                {totalDays} Days
              </p>
            </div>
          )}
          <div className="px-6">
            <p className="text-xs font-bold text-gray-400 uppercase">
              {isShowingSavedItineraries ? "Saved Plans" : "Results Found"}
            </p>
            <p className="text-xl font-bold text-[#004E89]">
              {recommendations.length}
            </p>
          </div>
        </div>
      </header>

      {recommendations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            No recommendations found for your criteria.
          </p>
          <Link to="/preferences" className="mt-4 inline-block">
            <Button variant="ghost">Adjust Preferences</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.map((rec, idx) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              index={idx}
              isAuthenticated={isAuthenticated}
              isSaved={isShowingSavedItineraries}
            />
          ))}
        </div>
      )}

      {/* Saved Itineraries Section - only show when displaying fresh recommendations */}
      {/* {isAuthenticated && savedItineraries.length > 0 && preferences && (
        <section className="mt-16 mb-24">
          <div className="flex items-center gap-3 mb-8">
            <Bookmark className="w-6 h-6 text-[#004E89]" />
            <h3 className="text-2xl font-bold text-[#004E89]">
              Saved Itineraries
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItineraries.map((itinerary) => (
              <SavedItineraryCard
                key={itinerary.id}
                itinerary={itinerary}
                onDelete={handleDeleteItinerary}
              />
            ))}
          </div>
        </section>
      )} */}

      {recommendations.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40">
          <Link to="/route" state={{ recommendation: recommendations[0] }}>
            <Button className="shadow-2xl px-12 py-5 rounded-full text-lg shadow-[#FF6B35]/40 animate-bounce">
              View Full Itinerary
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

const RecommendationCard: React.FC<{
  recommendation: TravelRecommendation;
  index: number;
  isAuthenticated: boolean;
  isSaved?: boolean;
}> = ({ recommendation, index, isAuthenticated, isSaved = false }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      await userAPI.saveItinerary({
        itinerary: recommendation,
        title:
          recommendation.title ??
          `${recommendation.days}-Day ${recommendation.travel_styles.join(" & ")} Adventure`,
        isFavorite: false,
      });

      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const dayKeys = Object.keys(recommendation.itinerary);
  const firstDay = recommendation.itinerary[dayKeys[0]];
  const allLocations = dayKeys.flatMap(
    (key) => recommendation.itinerary[key].locations,
  );
  const uniqueLocations = [...new Set(allLocations)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 relative"
    >
      <div className="h-48 relative overflow-hidden bg-gradient-to-br from-[#004E89] to-[#FF6B35]">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl">🗺️</span>
        </div>
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {recommendation.travel_styles.slice(0, 2).map((style) => (
            <span
              key={style}
              className="bg-white/90 text-[#004E89] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg"
            >
              {style}
            </span>
          ))}
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md">
          <span className="text-xs font-bold text-[#004E89]">
            {recommendation.budget_category}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-6 text-white">
          <h3 className="text-xl font-bold">
            {recommendation.days}-Day Adventure
          </h3>
          <p className="text-sm opacity-80">
            from {recommendation.start_location}
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">
            Highlights
          </p>
          <div className="flex flex-wrap gap-1">
            {recommendation.highlights.slice(0, 3).map((highlight, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-2 text-[#F7B32B]" />
            <span className="text-xs font-semibold">
              {recommendation.days} Days
            </span>
          </div>
          <div className="flex items-center text-gray-500">
            <MapPin className="w-4 h-4 mr-2 text-[#004E89]" />
            <span className="text-xs font-semibold">
              {uniqueLocations.length} Places
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
              Estimated Cost
            </p>
            <p className="text-lg font-bold text-[#004E89]">
              Rs. {recommendation.estimated_cost.total.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                  saved
                    ? "bg-green-50 border-green-300 text-green-600"
                    : saving
                      ? "bg-gray-50 border-gray-200 text-gray-400 cursor-wait"
                      : "border-gray-200 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35] hover:bg-orange-50"
                }`}
                title={saved ? "Saved!" : "Save itinerary"}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            )}
            <Link to="/route" state={{ recommendation }}>
              <button className="flex items-center text-[#FF6B35] font-bold text-sm hover:translate-x-1 transition-transform">
                View Plan <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </Link>
          </div>
        </div>
        {saveError && (
          <p className="text-xs text-red-500 mt-2 px-6 pb-4">⚠ {saveError}</p>
        )}
      </div>
    </motion.div>
  );
};

const SavedItineraryCard: React.FC<{
  itinerary: SavedItineraryResponse;
  onDelete: (id: number) => void;
}> = ({ itinerary, onDelete }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {itinerary.isFavorite && (
              <Star className="w-4 h-4 text-[#F7B32B] fill-[#F7B32B]" />
            )}
            <h4 className="font-bold text-[#004E89] line-clamp-1">
              {itinerary.title || `Itinerary #${itinerary.combinationId}`}
            </h4>
          </div>
          <p className="text-xs text-gray-400">
            Saved on {formatDate(itinerary.createdAt)}
          </p>
        </div>
        <button
          onClick={() => onDelete(itinerary.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete itinerary"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {itinerary.notes && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {itinerary.notes}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          ID: {itinerary.combinationId}
        </span>
        <Link
          to={`/preferences`}
          className="text-xs font-semibold text-[#FF6B35] hover:underline"
        >
          View Details →
        </Link>
      </div>
    </motion.div>
  );
};

export default Recommendations;
