import ast
import logging
import os
from itertools import combinations

import numpy as np
import pandas as pd

from config import settings

logger = logging.getLogger(__name__)


class LocationRecommender:
    def __init__(self, data_path: str = None):
        if data_path:
            self.places_df = pd.read_csv(data_path)
        else:
            base_dir = os.path.dirname(os.path.dirname(__file__))
            default_path = os.path.join(base_dir, 'data', 'mihintale_places_expanded.csv')
            self.places_df = pd.read_csv(default_path)

    def extract_activities(self, doc):
        try:
            return ast.literal_eval(doc)
        except (ValueError, SyntaxError) as e:
            logger.debug("Error parsing document: %s", e)
            return []

    def recommend_locations(self, user_activities, user_bucket_list):
        recommended_locations = []
        for activity in user_activities:
            activity_matches = []
            for index, row in self.places_df.iterrows():
                extracted_activities = row['extracted_activities']
                activity_scores = row['activity_scores']
                
                if isinstance(extracted_activities, str):
                    try:
                        extracted_activities = ast.literal_eval(extracted_activities)
                    except Exception as e:
                        logger.debug("Error parsing extracted_activities for place %s: %s", row['name'], e)
                        continue
                        
                if isinstance(activity_scores, str):
                    try:
                        activity_scores = ast.literal_eval(activity_scores)
                    except Exception as e:
                        logger.debug("Error parsing activity_scores for place %s: %s", row['name'], e)
                        continue
                
                if activity in extracted_activities:
                    activity_index = extracted_activities.index(activity)
                    
                    if activity_index < len(activity_scores):
                        activity_score = activity_scores[activity_index]
                    else:
                        logger.debug("Activity index out of range for place %s.", row['name'])
                        continue
                        
                    activity_matches.append({
                        'place': row['name'],
                        'activity': activity,
                        'score': activity_score
                    })
            if activity_matches:
                sorted_matches = sorted(activity_matches, key=lambda x: x['score'], reverse=True)
                recommended_locations.extend([match['place'] for match in sorted_matches[:5]])
                
        bucket_list_matches = [
            place for place in self.places_df['name'] 
            if place in user_bucket_list or any(place.lower() in address.lower() for address in user_bucket_list)
        ]
        recommended_locations.extend(bucket_list_matches)
        
        return list(set(recommended_locations))

    def get_places_for_each_activity(self, user_activities, recommended_locations):
        activity_places = {activity: [] for activity in user_activities}
        
        for activity in user_activities:
            for index, row in self.places_df[self.places_df['name'].isin(recommended_locations)].iterrows():
                extracted_activities = row['extracted_activities']
                activity_scores = row['activity_scores']
                
                if isinstance(extracted_activities, str):
                    try:
                        extracted_activities = ast.literal_eval(extracted_activities)
                    except Exception as e:
                        logger.debug("Error parsing extracted_activities for place %s: %s", row['name'], e)
                        continue
                if isinstance(activity_scores, str):
                    try:
                        activity_scores = ast.literal_eval(activity_scores)
                    except Exception as e:
                        logger.debug("Error parsing activity_scores for place %s: %s", row['name'], e)
                        continue
                
                if activity in extracted_activities:
                    activity_index = extracted_activities.index(activity)
                    if activity_index < len(activity_scores):
                        activity_score = activity_scores[activity_index]
                        activity_places[activity].append((row['name'], activity_score))
                    else:
                        logger.debug("Activity index out of range for place %s.", row['name'])
        
        return activity_places

    def get_top_location_sets_with_bucket_list(self, activity_places, user_bucket_list, top_n=10):
        unique_places = set()
        for places in activity_places.values():
            for place, score in places:
                unique_places.add(place)
                
        num_places = len(unique_places)
        if num_places == 0:
            return []
            
        combo_size = min(5, num_places)
        
        all_combinations = list(combinations(unique_places, combo_size))
        valid_combinations = []
        for combo in all_combinations:
            activity_counts = []
            for activity, places in activity_places.items():
                count = sum(1 for place, score in places if place in combo)
                activity_counts.append(count)
            
            # Relaxed constraint: as long as there is some activity match
            if sum(activity_counts) > 0:
                valid_combinations.append(combo)
        
        if not valid_combinations:
            # Slicing safely if the all_combinations fallback gives hundreds
            valid_combinations = all_combinations[:50]
        
        combo_scores = []
        for combo in valid_combinations:
            score_sum = 0
            for activity, places in activity_places.items():
                for place, score in places:
                    if place in combo:
                        score_sum += score
            for place in combo:
                if place in user_bucket_list or any(place.lower() in address.lower() for address in user_bucket_list):
                    score_sum += 1
            combo_scores.append((combo, score_sum))
        
        combo_scores.sort(key=lambda x: x[1], reverse=True)
        top_combinations = combo_scores[:top_n]
        
        final_combinations = []
        for combo, score_sum in top_combinations:
            rating_sum = 0
            rating_count = 0
            for place in combo:
                place_rating = self.places_df[self.places_df['name'] == place]['rating'].values
                if len(place_rating) > 0 and not pd.isna(place_rating[0]):
                    rating_sum += place_rating[0]
                    rating_count += 1
            if rating_count > 0:
                avg_rating = rating_sum / rating_count
                score_sum += avg_rating
            final_combinations.append((combo, score_sum))
        
        final_combinations.sort(key=lambda x: x[1], reverse=True)
        
        return final_combinations[:top_n]

    @staticmethod
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return R * c

    def calculate_min_travel_distance(self, places):
        if not places:
            return 0, []
        if len(places) == 1:
            return 0, list(places)
            
        # Extract coordinates for all places once
        coords = {}
        for p in places:
            row = self.places_df[self.places_df['name'] == p]
            if not row.empty:
                coords[p] = row[['lat', 'lng']].values[0]
            else:
                # If a place is missing from DB, we just arbitrarily set it to 0,0 
                # or skip its distance impact (it shouldn't happen based on our filter)
                coords[p] = (0.0, 0.0)

        # Greedy nearest neighbor algorithm (approximate TSP)
        # Try starting from each node to find the best route
        best_overall_distance = float('inf')
        best_overall_route = None

        places_list = list(places)
        for start_node in places_list:
            unvisited = set(places_list)
            unvisited.remove(start_node)
            current_node = start_node
            current_route_dist = 0
            current_route = [start_node]
            
            while unvisited:
                nearest_neighbor = None
                min_dist_to_neighbor = float('inf')
                lat1, lon1 = coords[current_node]
                
                for candidate in unvisited:
                    lat2, lon2 = coords[candidate]
                    dist = self.haversine(lat1, lon1, lat2, lon2)
                    if dist < min_dist_to_neighbor:
                        min_dist_to_neighbor = dist
                        nearest_neighbor = candidate
                        
                current_route_dist += min_dist_to_neighbor
                current_route.append(nearest_neighbor)
                current_node = nearest_neighbor
                unvisited.remove(nearest_neighbor)
                
            if current_route_dist < best_overall_distance:
                best_overall_distance = current_route_dist
                best_overall_route = current_route
                
        return best_overall_distance, tuple(best_overall_route)

    def recommend_top_places(self, user_activities, user_bucket_list):
        cleaned_activities = []
        for activity in user_activities:
            act = activity.lower().strip()
            if ' safaris' in act or act == 'safaris':
                 act = act.replace('safaris', 'wild life safaris')
            if 'hot air ballooning' in act:
                 act = act.replace('hot air ballooning', 'air ballooning')
            cleaned_activities.append(act)
        
        user_activities = cleaned_activities
        recommended_locations = self.recommend_locations(user_activities, user_bucket_list)
        activity_places = self.get_places_for_each_activity(user_activities, recommended_locations)
        bucket_list = self.places_df[
            self.places_df['name'].isin(user_bucket_list) | 
            self.places_df['formatted_address'].isin(user_bucket_list)
        ]['name'].tolist()
        top_location_sets = self.get_top_location_sets_with_bucket_list(activity_places, bucket_list, top_n=10)

        if not top_location_sets:
            # Fallback simple recommendation based on simple logic if combos fail
            return list(set(recommended_locations))[:5]
        
        total_scores = [score for _, score in top_location_sets]
        min_total_score = min(total_scores)
        max_total_score = max(total_scores)

        distances = []
        for combo, _ in top_location_sets:
            min_distance, _ = self.calculate_min_travel_distance(combo)
            distances.append(min_distance)
        min_distance = min(distances)
        max_distance = max(distances)

        if max_total_score - min_total_score == 0:
            normalized_scores = [1 for _ in total_scores]
        else:
            normalized_scores = [(score - min_total_score) / (max_total_score - min_total_score) for score in total_scores]
        
        if max_distance - min_distance == 0:
            normalized_distances = [1 for _ in distances]
        else:
            normalized_distances = [(max_distance - distance) / (max_distance - min_distance) for distance in distances]

        alpha = 0.7
        final_scores = [
            alpha * norm_score + (1 - alpha) * norm_distance 
            for norm_score, norm_distance in zip(normalized_scores, normalized_distances)
        ]

        if not final_scores:
            return list(set(recommended_locations))[:5]
        
        max_final_score_index = final_scores.index(max(final_scores))
        combo, score = top_location_sets[max_final_score_index]
        min_distance, best_route = self.calculate_min_travel_distance(combo)

        return best_route

# Expose a pre-initialized singleton if desired
_recommender_instance = None

def get_recommender():
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = LocationRecommender()
    return _recommender_instance
