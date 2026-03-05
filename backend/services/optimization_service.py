"""
Route Optimization Service — Nearest Neighbour TSP
-----------------------------------------------------
Accepts an ordered list of destination dicts (from causal_recommender)
and returns the TSP-optimised visiting order with distances and totals.
"""

import logging
import math
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in km between two GPS points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1))
         * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_neighbour_tsp(destinations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Greedy Nearest Neighbour TSP over destinations that have lat/lng.
    Destinations without coordinates are appended at the end.

    Returns ordered list of dicts with added 'distance_from_prev_km'.
    """
    with_coords    = [d for d in destinations if d.get("lat") and d.get("lng")]
    without_coords = [d for d in destinations if not (d.get("lat") and d.get("lng"))]

    if len(with_coords) <= 1:
        ordered = with_coords + without_coords
        for i, stop in enumerate(ordered):
            stop["distance_from_prev_km"] = 0.0
        return ordered

    unvisited = list(range(len(with_coords)))
    # Start from the first destination (highest causal score)
    current   = unvisited.pop(0)
    route     = [current]

    while unvisited:
        lat1, lon1 = with_coords[current]["lat"], with_coords[current]["lng"]
        nearest, min_dist = None, float("inf")
        for idx in unvisited:
            lat2, lon2 = with_coords[idx]["lat"], with_coords[idx]["lng"]
            d = haversine_km(lat1, lon1, lat2, lon2)
            if d < min_dist:
                min_dist, nearest = d, idx
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    ordered_dests = []
    prev_lat, prev_lon = None, None
    for i, idx in enumerate(route):
        dest = dict(with_coords[idx])
        lat, lon = dest["lat"], dest["lng"]
        if prev_lat is None:
            dest["distance_from_prev_km"] = 0.0
        else:
            dest["distance_from_prev_km"] = round(haversine_km(prev_lat, prev_lon, lat, lon), 3)
        prev_lat, prev_lon = lat, lon
        ordered_dests.append(dest)

    # Append destinations without coordinates at the end
    for dest in without_coords:
        dest = dict(dest)
        dest["distance_from_prev_km"] = 0.0
        ordered_dests.append(dest)

    return ordered_dests


def build_route_summary(ordered: List[Dict[str, Any]], time_avail_h: float) -> Dict[str, Any]:
    """
    Compute total_distance_km, total_cost_lkr, estimated_time_h from ordered route.
    estimated_time_h accounts for visit durations + travel time (30 km/h avg speed).
    """
    total_distance = sum(d.get("distance_from_prev_km", 0.0) for d in ordered)
    total_cost     = sum(d.get("cost_lkr", 0.0) for d in ordered)
    visit_time     = sum(d.get("visit_duration_h", 1.0) for d in ordered)
    travel_time    = total_distance / 30.0  # avg 30 km/h in rugged terrain
    est_time       = round(visit_time + travel_time, 2)

    return {
        "total_distance_km": round(total_distance, 3),
        "total_cost_lkr":    round(total_cost, 2),
        "estimated_time_h":  est_time,
    }
