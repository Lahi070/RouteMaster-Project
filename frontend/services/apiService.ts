import {
  RecommendationRequest,
  RecommendationResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ChangePasswordRequest,
  UserPreferenceResponse,
  SavedItineraryResponse,
  TravelRecommendation,
  CausalRecommendRequest,
  CausalRecommendResponse,
} from "../types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

// Token management
let accessToken: string | null = localStorage.getItem("accessToken");

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
};

export const getAccessToken = () => accessToken;

// Helper to transform backend user response to frontend format
const transformUser = (backendUser: any): User => {
  return {
    ...backendUser,
    fullName: backendUser.full_name ?? backendUser.fullName ?? null,
  };
};

// Helper to transform frontend user data to backend format
const transformUserForBackend = (frontendUser: Partial<User>): any => {
  const { fullName, ...rest } = frontendUser;
  return {
    ...rest,
    ...(fullName !== undefined ? { full_name: fullName } : {}),
  };
};

// API client with automatic token refresh
const apiClient = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add authorization header if token exists
  if (accessToken) {
    (headers as any)["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Important for httpOnly cookies
  });

  // If unauthorized, try to refresh token
  if (response.status === 401 && accessToken) {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      setAccessToken(data.accessToken);

      // Retry original request with new token
      (headers as any)["Authorization"] = `Bearer ${data.accessToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    } else {
      // Refresh failed, clear token and redirect to login
      setAccessToken(null);
      window.location.href = "/#/login";
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
};

// Authentication APIs
export const authAPI = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }

    const result = await response.json();
    setAccessToken(result.accessToken);
    return result;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    const result = await response.json();
    setAccessToken(result.accessToken);
    return result;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
      });
    } finally {
      setAccessToken(null);
    }
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const result = await response.json();
    setAccessToken(result.accessToken);
    return result;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    const response = await apiClient(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Password change failed");
    }

    // After password change, user needs to login again
    setAccessToken(null);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient(`${API_BASE_URL}/auth/me`);

    if (!response.ok) {
      throw new Error("Failed to get user info");
    }

    const data = await response.json();
    return transformUser(data);
  },
};

// User APIs
export const userAPI = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient(`${API_BASE_URL}/users/me`);

    if (!response.ok) {
      throw new Error("Failed to get profile");
    }

    const data = await response.json();
    return transformUser(data);
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const backendData = transformUserForBackend(data);
    const response = await apiClient(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Profile update failed");
    }

    const responseData = await response.json();
    return transformUser(responseData);
  },

  deleteAccount: async (): Promise<void> => {
    const response = await apiClient(`${API_BASE_URL}/users/me`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Account deletion failed");
    }

    setAccessToken(null);
  },

  getPreferences: async (): Promise<UserPreferenceResponse | null> => {
    const response = await apiClient(`${API_BASE_URL}/users/me/preferences`);

    if (!response.ok) {
      throw new Error("Failed to get preferences");
    }

    return response.json();
  },

  updatePreferences: async (data: {
    preferredTravelStyles?: string[];
    preferredBudgetRange?: string;
    preferredStartLocation?: string;
  }): Promise<UserPreferenceResponse> => {
    const response = await apiClient(`${API_BASE_URL}/users/me/preferences`, {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Preferences update failed");
    }

    return response.json();
  },

  getSavedItineraries: async (): Promise<SavedItineraryResponse[]> => {
    const response = await apiClient(
      `${API_BASE_URL}/users/me/saved-itineraries`,
    );

    if (!response.ok) {
      throw new Error("Failed to get saved itineraries");
    }

    return response.json();
  },

  saveItinerary: async (data: {
    itinerary?: TravelRecommendation | Record<string, unknown>;
    title?: string;
    notes?: string;
    isFavorite?: boolean;
  }): Promise<SavedItineraryResponse> => {
    const response = await apiClient(
      `${API_BASE_URL}/users/me/saved-itineraries`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to save itinerary");
    }

    return response.json();
  },

  deleteItinerary: async (itineraryId: number): Promise<void> => {
    const response = await apiClient(
      `${API_BASE_URL}/users/me/saved-itineraries/${itineraryId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete itinerary");
    }
  },
};

// Recommendation APIs (updated to use apiClient for protected routes)
export const getRecommendations = async (
  request: RecommendationRequest,
): Promise<RecommendationResponse> => {
  const response = await apiClient(`${API_BASE_URL}/api/v1/recommendations`, {
    method: "POST",
    body: JSON.stringify({
      travelStyles: request.travelStyles,
      days: request.days,
      startLocation: request.startLocation,
      budget: request.budget,
    }),
  });

  if (!response.ok) {
    // Parse Pydantic validation errors (422) and surface a readable message
    if (response.status === 422) {
      try {
        const errBody = await response.json();
        const detail = errBody?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          const first = detail[0];
          const field = (first.loc as string[])?.slice(1).join(".") ?? "input";
          const msg = first.msg ?? "validation error";
          throw new Error(`Validation error on '${field}': ${msg}`);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith("Validation")) {
          throw parseErr;
        }
      }
    }
    throw new Error(`Request failed (${response.status}). Please check your inputs and try again.`);
  }

  return response.json();
};

export const getStartLocations = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/start-locations`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const locations = await response.json();
  return locations.map((loc: { name: string }) => loc.name);
};

export const getTravelStyles = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/travel-styles`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

export const getBudgetRanges = async (): Promise<
  Record<string, { min: number; max: number; label: string }>
> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/budget-ranges`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

export const getCombinationById = async (
  combinationId: number,
): Promise<import("../types").TravelRecommendation> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/combinations/${combinationId}`,
  );
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

export const getLocations = async (
  category?: string,
): Promise<import("../types").LocationInfo[]> => {
  const url = category
    ? `${API_BASE_URL}/api/v1/locations?category=${category}`
    : `${API_BASE_URL}/api/v1/locations`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

export const getStartLocationCoordinates = async (): Promise<
  Record<string, [number, number]>
> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/start-locations`);
  if (!response.ok) {
    throw new Error("Failed to fetch start locations");
  }
  const locations = await response.json();
  const coordsMap: Record<string, [number, number]> = {};
  for (const loc of locations) {
    if (loc.coordinates) {
      coordsMap[loc.name] = loc.coordinates;
    }
  }
  return coordsMap;
};

// Admin Location Management APIs
export const adminLocationAPI = {
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    district?: string;
    search?: string;
  }): Promise<import("../types").LocationListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined)
      queryParams.append("skip", String(params.skip));
    if (params?.limit !== undefined)
      queryParams.append("limit", String(params.limit));
    if (params?.category) queryParams.append("category", params.category);
    if (params?.district) queryParams.append("district", params.district);
    if (params?.search) queryParams.append("search", params.search);

    const url = `${API_BASE_URL}/admin/locations${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch locations");
    }

    return response.json();
  },

  getById: async (id: number): Promise<import("../types").Location> => {
    const response = await apiClient(`${API_BASE_URL}/admin/locations/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch location");
    }

    return response.json();
  },

  create: async (
    data: import("../types").LocationCreate,
  ): Promise<import("../types").Location> => {
    const response = await apiClient(`${API_BASE_URL}/admin/locations`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create location");
    }

    return response.json();
  },

  update: async (
    id: number,
    data: import("../types").LocationUpdate,
  ): Promise<import("../types").Location> => {
    const response = await apiClient(`${API_BASE_URL}/admin/locations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update location");
    }

    return response.json();
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient(`${API_BASE_URL}/admin/locations/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete location");
    }

    return response.json();
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient(
      `${API_BASE_URL}/admin/locations/categories`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    return response.json();
  },

  getDistricts: async (): Promise<string[]> => {
    const response = await apiClient(
      `${API_BASE_URL}/admin/locations/districts`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch districts");
    }

    return response.json();
  },
};

// Admin User Management APIs
export const adminUserAPI = {
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    role?: string;
  }): Promise<import("../types").User[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined)
      queryParams.append("skip", String(params.skip));
    if (params?.limit !== undefined)
      queryParams.append("limit", String(params.limit));
    if (params?.role) queryParams.append("role", params.role);

    const url = `${API_BASE_URL}/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiClient(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch users");
    }

    return response.json();
  },
};

// ── Causal AI Recommendation ──────────────────────────────────────────────────

export const getCausalRecommendations = async (
  req: CausalRecommendRequest,
): Promise<CausalRecommendResponse> => {
  const response = await apiClient(`${API_BASE_URL}/api/recommend`, {
    method: "POST",
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `AI API error: ${response.status}`);
  }

  return response.json();
};
