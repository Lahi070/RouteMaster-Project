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
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Button from "../components/Button";
import { Link, useLocation } from "react-router-dom";
import { TravelRecommendation, DayItinerary, LocationInfo } from "../types";
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
  const location = useLocation();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [locationCoordinates, setLocationCoordinates] = useState<
    Record<string, [number, number]>
  >({});
  const [loadingCoords, setLoadingCoords] = useState(true);

  const recommendation = (
    location.state as { recommendation?: TravelRecommendation }
  )?.recommendation;

  // Fetch location coordinates from API
  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        // Fetch both start locations and regular locations in parallel
        const [startCoords, locations] = await Promise.all([
          getStartLocationCoordinates(),
          getLocations(),
        ]);

        const coordsMap: Record<string, [number, number]> = { ...startCoords };

        locations.forEach((loc) => {
          if (loc.coordinates) {
            coordsMap[loc.name] = loc.coordinates;
          }
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

  if (!recommendation) {
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
    // Cast locations to an array of objects to access properties
    const locs = day.locations as unknown as Record<string, any>[];

    locs.forEach((locObj) => {
      const displayName = locObj.name ? locObj.name.toString() : JSON.stringify(locObj);

      itineraryLocations.push({
        name: displayName,
        day: dayKey,
        dayNumber: dayIndex + 1,
        description: locObj.description || day.description, // Use location-specific description, fallback to day's
        transport: day.transport,
        coordinates: getLocationCoordinates(locObj),
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
                      <Layers className="w-3 h-3 mr-1" /> {loc.transport}
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
