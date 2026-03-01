import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
  X,
  Search,
  Filter,
} from "lucide-react";
import Button from "../components/Button";
import { Location, LocationCreate, LocationUpdate } from "../types";
import { adminLocationAPI } from "../services/apiService";

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  useEffect(() => {
    fetchLocations();
    fetchFilters();
  }, [searchTerm, categoryFilter, districtFilter]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminLocationAPI.getAll({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        district: districtFilter || undefined,
        limit: 500,
      });
      setLocations(response.locations);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch locations",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [cats, dists] = await Promise.all([
        adminLocationAPI.getCategories(),
        adminLocationAPI.getDistricts(),
      ]);
      setCategories(cats);
      setDistricts(dists);
    } catch (err) {
      console.error("Failed to fetch filters:", err);
    }
  };

  const handleAddLocation = async (data: LocationCreate) => {
    try {
      await adminLocationAPI.create(data);
      setShowAddModal(false);
      fetchLocations();
    } catch (err) {
      throw err;
    }
  };

  const handleEditLocation = async (data: LocationUpdate) => {
    if (!selectedLocation) return;
    try {
      await adminLocationAPI.update(selectedLocation.id, data);
      setShowEditModal(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return;
    try {
      await adminLocationAPI.delete(selectedLocation.id);
      setShowDeleteModal(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete location",
      );
      setShowDeleteModal(false);
    }
  };

  const openEditModal = (location: Location) => {
    setSelectedLocation(location);
    setShowEditModal(true);
  };

  const openDeleteModal = (location: Location) => {
    setSelectedLocation(location);
    setShowDeleteModal(true);
  };

  if (loading && locations.length === 0) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-6 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF6B35] mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[#004E89] mb-2">
            Location Management
          </h2>
          <p className="text-gray-500">
            Manage all tourist locations in the database
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="glass p-2 px-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase">
              Total Locations
            </p>
            <p className="text-xl font-bold text-[#004E89]">{total}</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="shadow-lg">
            <Plus size={20} className="mr-2" />
            Add Location
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-8 glass p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-[#004E89]" />
          <h3 className="font-bold text-[#004E89]">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
          >
            <option value="">All Districts</option>
            {districts.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>
        {(searchTerm || categoryFilter || districtFilter) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("");
              setDistrictFilter("");
            }}
            className="mt-4 text-sm text-[#FF6B35] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No locations found</p>
          <Button
            variant="ghost"
            onClick={() => setShowAddModal(true)}
            className="mt-4"
          >
            Add Your First Location
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location, idx) => (
            <LocationCard
              key={location.id}
              location={location}
              index={idx}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <LocationModal
            mode="create"
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddLocation}
            categories={categories}
            districts={districts}
          />
        )}
        {showEditModal && selectedLocation && (
          <LocationModal
            mode="edit"
            location={selectedLocation}
            onClose={() => {
              setShowEditModal(false);
              setSelectedLocation(null);
            }}
            onSubmit={handleEditLocation}
            categories={categories}
            districts={districts}
          />
        )}
        {showDeleteModal && selectedLocation && (
          <DeleteConfirmModal
            location={selectedLocation}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedLocation(null);
            }}
            onConfirm={handleDeleteLocation}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Location Card Component
const LocationCard: React.FC<{
  location: Location;
  index: number;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
}> = ({ location, index, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 relative"
    >
      {/* Header with gradient */}
      <div className="h-32 relative overflow-hidden bg-gradient-to-br from-[#004E89] to-[#FF6B35]">
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="text-white/30 w-16 h-16" />
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 text-[#004E89] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
            {location.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 text-[#FF6B35] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
            {location.district}
          </span>
        </div>
        <div className="absolute bottom-3 left-4 text-white">
          <h3 className="text-lg font-bold line-clamp-1">{location.name}</h3>
          <p className="text-xs opacity-80">{location.stringId}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {location.description}
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock size={16} />
            <span className="text-sm">{location.timeRequired}h</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <DollarSign size={16} />
            <span className="text-sm">
              {location.entranceFee > 0
                ? `LKR ${location.entranceFee.toLocaleString()}`
                : "Free"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(location)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#004E89] text-white rounded-lg hover:bg-[#003a6b] transition-colors"
          >
            <Edit size={16} />
            <span className="text-sm font-medium">Edit</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(location)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 size={16} />
            <span className="text-sm font-medium">Delete</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Location Form Modal
const LocationModal: React.FC<{
  mode: "create" | "edit";
  location?: Location;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  categories: string[];
  districts: string[];
}> = ({ mode, location, onClose, onSubmit, categories, districts }) => {
  // Normalize coordinates to object format for form state
  const normalizeCoordinates = (coords: any) => {
    if (!coords) return null;
    if (Array.isArray(coords)) {
      return { lat: coords[0], lng: coords[1] };
    }
    return coords;
  };

  const [formData, setFormData] = useState<LocationCreate>({
    stringId: location?.stringId || "",
    name: location?.name || "",
    category: location?.category || "",
    district: location?.district || "",
    timeRequired: location?.timeRequired || 0,
    entranceFee: location?.entranceFee || 0,
    description: location?.description || "",
    coordinates: normalizeCoordinates(location?.coordinates),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleCoordinateChange = (field: "lat" | "lng", value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const currentCoords = normalizeCoordinates(formData.coordinates);
      setFormData({
        ...formData,
        coordinates: {
          lat: field === "lat" ? numValue : currentCoords?.lat || 0,
          lng: field === "lng" ? numValue : currentCoords?.lng || 0,
        },
      });
    } else if (value === "") {
      setFormData({ ...formData, coordinates: null });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center rounded-t-3xl">
          <h3 className="text-2xl font-bold text-[#004E89]">
            {mode === "create" ? "Add New Location" : "Edit Location"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                String ID *
              </label>
              <input
                type="text"
                required
                value={formData.stringId}
                onChange={(e) =>
                  setFormData({ ...formData, stringId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="e.g., temple-tooth-relic"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="e.g., Temple of the Tooth Relic"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                required
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
              >
                <option value="">Select a district</option>
                {districts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Required (hours) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.timeRequired}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeRequired: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entrance Fee (LKR) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.entranceFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entranceFee: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 resize-none"
              placeholder="Detailed description of the location..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coordinates *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                required
                value={
                  formData.coordinates
                    ? Array.isArray(formData.coordinates)
                      ? formData.coordinates[0]
                      : formData.coordinates.lat
                    : ""
                }
                onChange={(e) => handleCoordinateChange("lat", e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="Latitude"
              />
              <input
                type="number"
                step="any"
                required
                value={
                  formData.coordinates
                    ? Array.isArray(formData.coordinates)
                      ? formData.coordinates[1]
                      : formData.coordinates.lng
                    : ""
                }
                onChange={(e) => handleCoordinateChange("lng", e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="Longitude"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a28] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading
                ? "Saving..."
                : mode === "create"
                  ? "Create Location"
                  : "Update Location"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<{
  location: Location;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}> = ({ location, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Delete Location</h3>
            <p className="text-sm text-gray-500">
              This action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[#004E89]">{location.name}</span>?
          This will permanently remove the location from the database.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Locations;
