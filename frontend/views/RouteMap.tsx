import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  Brain,
  Route,
} from "lucide-react";
import Button from "../components/Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TravelRecommendation, DayItinerary, LocationInfo, OptimizedStop, CausalRecommendResponse } from "../types";
import {
  getLocations,
  getStartLocationCoordinates,
} from "../services/apiService";


interface ItineraryLocation {
  name: string;
  day: string;
  dayNumber: number;
  description: string;
  transport: string;
  coordinates: [number, number] | null;
}

const RouteMap: React.FC = () => {
  const location   = useLocation();
  const navigate   = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [locationCoordinates, setLocationCoordinates] = useState<
    Record<string, [number, number]>
  >({});
  const [loadingCoords, setLoadingCoords] = useState(true);

  const routeState  = location.state as {
    recommendation?: TravelRecommendation;
    aiRoute?: OptimizedStop[];
    aiResult?: CausalRecommendResponse;
  } | null;

  const recommendation = routeState?.recommendation;
  const aiRoute        = routeState?.aiRoute;
  const aiResult       = routeState?.aiResult;
  const isAIMode       = !!aiRoute && aiRoute.length > 0;

  // Fetch location coordinates from API
  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const [startCoords, locations] = await Promise.all([
          getStartLocationCoordinates(),
          getLocations(),
        ]);

        const coordsMap: Record<string, [number, number]> = { ...startCoords };

        locations.forEach((loc) => {
          const raw = loc.coordinates as any;
          if (!raw) return;

          let pair: [number, number] | null = null;

          if (Array.isArray(raw) && raw.length === 2) {
            // [lat, lng] tuple
            pair = [Number(raw[0]), Number(raw[1])];
          } else if (typeof raw === "object" && raw.lat != null && raw.lng != null) {
            // { lat, lng } dict
            pair = [Number(raw.lat), Number(raw.lng)];
          }

          if (pair) coordsMap[loc.name] = pair;
        });

        setLocationCoordinates(coordsMap);
      } catch (error) {
        console.error("Failed to fetch location coordinates:", error);
        setLocationCoordinates({});
      } finally {
        setLoadingCoords(false);
      }
    };

    fetchCoordinates();
  }, []);

  const getLocationCoordinates = (
    locationName: string | Record<string, unknown>,
  ): [number, number] | null => {
    // Handle non-string values (API may return objects)
    const name =
      typeof locationName === "string"
        ? locationName
        : typeof locationName === "object" && locationName !== null
          ? ((locationName as Record<string, unknown>).name?.toString() ??
            JSON.stringify(locationName))
          : String(locationName ?? "");
    if (!name) return null;

    // Try exact match first
    if (locationCoordinates[name]) {
      return locationCoordinates[name];
    }
    // Try partial match
    for (const key of Object.keys(locationCoordinates)) {
      if (
        name.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(name.toLowerCase())
      ) {
        return locationCoordinates[key];
      }
    }
    return null;
  };

  if (!recommendation && !isAIMode) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 text-lg mb-4">
            No itinerary selected. Please select a travel plan first.
          </p>
          <Link to="/recommendations">
            <Button>Go to Recommendations</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingCoords) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF6B35] mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading map data...</p>
        </div>
      </div>
    );
  }

  // ── AI Route Mode ─────────────────────────────────────────────────────────
  if (isAIMode) {
    const aiStops = aiRoute!.filter(s => s.lat && s.lng);
    const polyAI  = aiStops.map(s => [s.lat!, s.lng!] as [number, number]);
    const centerAI: [number, number] = aiStops.length > 0
      ? [
          aiStops.reduce((a, s) => a + s.lat!, 0) / aiStops.length,
          aiStops.reduce((a, s) => a + s.lng!, 0) / aiStops.length,
        ]
      : [8.35, 80.51];

    return (
      <div className="h-screen pt-20 flex flex-col md:flex-row overflow-hidden">
        {/* AI Sidebar */}
        <div className="w-full md:w-[450px] bg-white border-r border-gray-200 overflow-y-auto z-10 shadow-xl">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-[#004E89] flex items-center gap-2">
                <Brain size={22} className="text-[#FF6B35]" /> AI Optimised Route
              </h2>
              <button onClick={() => navigate(-1)}
                className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5">Ordered by Nearest Neighbour TSP</p>

            {/* Summary strip */}
            {aiResult && (
              <div className="mb-5 p-4 bg-gradient-to-br from-[#004E89]/5 to-[#FF6B35]/5 rounded-xl space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Distance</span>
                  <span className="font-bold text-[#004E89]">{aiResult.total_distance_km.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Cost</span>
                  <span className="font-bold text-[#FF6B35]">LKR {aiResult.total_cost_lkr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Est. Time</span>
                  <span className="font-bold">{aiResult.estimated_time_h}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Model</span>
                  <span className="font-bold text-xs text-purple-600">{aiResult.model_name}</span>
                </div>
              </div>
            )}

            {/* Stops */}
            <div className="space-y-4 relative">
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5
                              bg-gradient-to-b from-[#FF6B35] via-[#F7B32B] to-[#06D6A0]" />
              {aiRoute!.map((stop, idx) => (
                <motion.div key={stop.order}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative pl-12 cursor-pointer group transition-all
                    ${selectedIdx === idx ? "scale-[1.02]" : ""}`}>
                  {/* Dot */}
                  <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center
                    border-4 border-white shadow-md z-10 transition-all
                    ${selectedIdx === idx ? "bg-[#FF6B35] scale-110" : "bg-white group-hover:bg-gray-50"}`}>
                    <span className={`text-sm font-bold ${selectedIdx === idx ? "text-white" : "text-gray-400"}`}>
                      {stop.order}
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl border-2 transition-all
                    ${selectedIdx === idx ? "border-[#FF6B35] bg-[#FF6B35]/5 shadow-lg" : "border-gray-100"}`}>
                    <h4 className="font-bold text-lg text-[#004E89] mb-1">{stop.name}</h4>
                    <div className="flex gap-4 text-xs text-gray-500">
                      {stop.distance_from_prev_km > 0 && (
                        <span className="flex items-center gap-1">
                          <Route size={12} /> {stop.distance_from_prev_km.toFixed(1)} km from prev
                        </span>
                      )}
                      {stop.cost_lkr != null && (
                        <span>LKR {stop.cost_lkr.toLocaleString()}</span>
                      )}
                      {stop.visit_duration_h != null && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {stop.visit_duration_h}h
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10">
              <button
                onClick={() => navigate("/explain", {
                  state: {
                    explanations: aiResult?.explanations,
                    destinations: aiResult?.recommended_destinations,
                  }
                })}
                className="w-full py-4 bg-[#004E89] text-white rounded-2xl font-bold
                           flex items-center justify-center gap-2 hover:bg-[#003d6e] transition-colors">
                <Brain size={18} /> View AI Explanations
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-grow relative bg-gray-100">
          <MapContainer center={centerAI} zoom={14} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {aiStops.map((stop, idx) => {
              const icon = L.divIcon({
                className: "custom-div-icon",
                html: `<div style="background:${selectedIdx === idx ? "#004E89" : "#FF6B35"};
                  color:white;width:28px;height:28px;display:flex;justify-content:center;
                  align-items:center;border-radius:50%;font-weight:bold;border:2px solid white;
                  box-shadow:0 4px 6px -1px rgba(0,0,0,0.15);font-size:13px">${stop.order}</div>`,
                iconSize: [28, 28], iconAnchor: [14, 14],
              });
              return (
                <Marker key={stop.order} position={[stop.lat!, stop.lng!]} icon={icon}>
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-bold">{stop.name}</h4>
                      <p className="text-xs text-gray-500">Stop #{stop.order}</p>
                      {stop.distance_from_prev_km > 0 && (
                        <p className="text-xs text-gray-400">{stop.distance_from_prev_km.toFixed(1)} km from previous</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {polyAI.length > 1 && (
              <Polyline pathOptions={{ color: "#FF6B35", weight: 4, dashArray: "10, 10" }}
                positions={polyAI} />
            )}
          </MapContainer>
        </div>
      </div>
    );
  }

  // ── Classic itinerary mode continues below ─────────────────────────────────
  // Extract locations from itinerary
  const itineraryLocations: ItineraryLocation[] = [];
  const dayKeys = Object.keys(recommendation.itinerary).sort();

  // Add start location as the first point
  const startCoords = getLocationCoordinates(recommendation.start_location);
  if (startCoords) {
    itineraryLocations.push({
      name: recommendation.start_location,
      day: "start",
      dayNumber: 0,
      description: "Starting point",
      transport: "Start",
      coordinates: startCoords,
    });
  }

  dayKeys.forEach((dayKey, dayIndex) => {
    const day = recommendation.itinerary[dayKey];
    const locs = day.locations as unknown as Record<string, any>[];

    locs.forEach((locObj) => {
      const displayName = locObj.name ? locObj.name.toString() : JSON.stringify(locObj);

      // Prefer coordinates embedded directly in the location object (from itinerary builder)
      let coords: [number, number] | null = null;
      if (locObj.lat != null && locObj.lng != null) {
        coords = [parseFloat(locObj.lat), parseFloat(locObj.lng)];
      } else if (locObj.coordinates && Array.isArray(locObj.coordinates) && locObj.coordinates.length === 2) {
        coords = locObj.coordinates as [number, number];
      } else {
        // Fall back to the API-fetched name → coordinate map
        coords = getLocationCoordinates(displayName);
      }

      itineraryLocations.push({
        name: displayName,
        day: dayKey,
        dayNumber: dayIndex + 1,
        description: locObj.description || day.description,
        transport: day.transport,
        coordinates: coords,
      });
    });
  });

  // Get coordinates for map
  const validLocations = itineraryLocations.filter(
    (loc) => loc.coordinates !== null,
  );
  const polylineCoords = validLocations.map(
    (loc) => loc.coordinates as [number, number],
  );

  // Calculate center from valid coordinates
  const center: [number, number] =
    validLocations.length > 0
      ? [
        validLocations.reduce(
          (sum, loc) => sum + (loc.coordinates?.[0] || 0),
          0,
        ) / validLocations.length,
        validLocations.reduce(
          (sum, loc) => sum + (loc.coordinates?.[1] || 0),
          0,
        ) / validLocations.length,
      ]
      : [7.5, 80.7];

  return (
    <div className="h-screen pt-20 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-[450px] bg-white border-r border-gray-200 overflow-y-auto z-10 shadow-xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#004E89]">
              Your Itinerary
            </h2>
            <Link to="/recommendations">
              <button className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-400" />
              </button>
            </Link>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duration</span>
              <span className="font-bold text-[#004E89]">
                {recommendation.days} Days
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Budget</span>
              <span className="font-bold text-[#FF6B35]">
                Rs. {recommendation.estimated_cost.total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Start</span>
              <span className="font-bold">{recommendation.start_location}</span>
            </div>
          </div>

          <div className="space-y-6 relative">
            {/* Timeline Line */}
            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#FF6B35] via-[#F7B32B] to-[#06D6A0]" />

            {itineraryLocations.map((loc, idx) => (
              <motion.div
                key={`${loc.day}-${loc.name}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative pl-12 cursor-pointer group transition-all ${selectedIdx === idx ? "scale-[1.02]" : ""
                  }`}
                onClick={() => setSelectedIdx(idx)}
              >
                {/* Point */}
                <div
                  className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md z-10 transition-all ${selectedIdx === idx
                    ? "bg-[#FF6B35] scale-110"
                    : "bg-white group-hover:bg-gray-50"
                    }`}
                >
                  <span
                    className={`text-sm font-bold ${selectedIdx === idx ? "text-white" : "text-gray-400"}`}
                  >
                    {idx + 1}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl border-2 transition-all ${selectedIdx === idx
                    ? "border-[#FF6B35] bg-[#FF6B35]/5 shadow-lg"
                    : "border-gray-100"
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-[#004E89]">
                      {loc.name}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {loc.dayNumber === 0 ? "Start" : `Day ${loc.dayNumber}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {loc.description}
                  </p>
                  <div className="flex items-center text-gray-500 text-xs font-semibold space-x-4">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> {loc.transport}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 space-y-4">
            {/* <Link to="/explain">
              <Button className="w-full bg-[#004E89] py-4 text-white">
                Analyze AI Insights
              </Button>
            </Link> */}
            <Link to="/recommendations">
              <Button variant="outline" className="w-full py-4">
                View Other Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-grow relative bg-gray-100">
        <MapContainer
          center={center}
          zoom={8}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validLocations.map((loc, index) => {
            const markerLabel = String(index + 1);

            const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${loc.dayNumber === 0 ? '#1f2937' : '#FF6B35'}; 
                                color: white; 
                                width: 28px; 
                                height: 28px; 
                                display: flex; 
                                justify-content: center; 
                                align-items: center; 
                                border-radius: 50%; 
                                font-weight: bold; 
                                border: 2px solid white; 
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                font-size: 14px;">
                        ${markerLabel}
                      </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            return (
              <Marker
                key={`${loc.day}-${loc.name}-${index}`}
                position={loc.coordinates as [number, number]}
                icon={customIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-bold">{loc.name}</h4>
                    <p className="text-xs text-gray-500">
                      {loc.dayNumber === 0 ? "Start" : `Day ${loc.dayNumber}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {loc.description}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {polylineCoords.length > 1 && (
            <Polyline
              pathOptions={{ color: "#FF6B35", weight: 4, dashArray: "10, 10" }}
              positions={polylineCoords}
            />
          )}
        </MapContainer>

        {/* Float Controls */}
        <div className="absolute top-6 right-6 z-[1000] flex flex-col space-y-4">
          <div className="glass p-3 rounded-2xl shadow-xl flex items-center space-x-4 bg-white/90 backdrop-blur-md">
            <div className="bg-[#FF6B35] w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold">
              {recommendation.days}d
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">TRIP DURATION</p>
              <p className="text-sm font-bold text-[#004E89]">
                {itineraryLocations.length} Locations
              </p>
            </div>
          </div>

          <div className="glass p-3 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md">
            <p className="text-xs font-bold text-gray-400 mb-2">
              COST BREAKDOWN
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Entrance Fees</span>
                <span className="font-semibold">
                  Rs.{" "}
                  {recommendation.estimated_cost.entrance_fees.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Meals</span>
                <span className="font-semibold">
                  Rs. {recommendation.estimated_cost.meals.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transport</span>
                <span className="font-semibold">
                  Rs. {recommendation.estimated_cost.transport.toLocaleString()}
                </span>
              </div>
              {recommendation.estimated_cost.accommodation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Accommodation</span>
                  <span className="font-semibold">
                    Rs.{" "}
                    {recommendation.estimated_cost.accommodation.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-gray-700 font-bold">Total</span>
                <span className="font-bold text-[#FF6B35]">
                  Rs. {recommendation.estimated_cost.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
