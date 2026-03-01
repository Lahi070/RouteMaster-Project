
import { TravelStyle, Destination } from './types';

export const COLORS = {
  primary: '#FF6B35',    // Sunset Orange
  secondary: '#004E89',  // Deep Ocean Blue
  accent: '#F7B32B',     // Temple Gold
  success: '#06D6A0',    // Tropical Green
  background: '#FAFAFA',
  text: '#2D3748',
  textLight: '#718096'
};

export const MOCK_DESTINATIONS: Destination[] = [
  {
    id: '1',
    name: 'Sigiriya Lion Rock',
    category: TravelStyle.CULTURAL,
    description: 'An ancient rock fortress located in the northern Matale District near the town of Dambulla in the Central Province, Sri Lanka. It is a site of historical and archaeological significance that is dominated by a massive column of rock nearly 200 metres high.',
    image: 'https://picsum.photos/seed/sigiriya/800/600',
    duration: '3-4 hours',
    distanceFromPrevious: '0 km',
    costLKR: 10500,
    rating: 4.8,
    reviewsCount: 12450,
    openingHours: '7:00 AM - 5:30 PM',
    coordinates: [7.9570, 80.7603],
    highlights: ['Mirror Wall', 'Lion Paw entrance', 'Frescoes', 'Water Gardens']
  },
  {
    id: '2',
    name: 'Temple of the Sacred Tooth Relic',
    category: TravelStyle.SPIRITUAL,
    description: 'Located in the royal palace complex of the former Kingdom of Kandy, which houses the relic of the tooth of the Buddha. Since ancient times, the relic has played an important role in local politics because it is believed that whoever holds the relic holds the governance of the country.',
    image: 'https://picsum.photos/seed/kandy/800/600',
    duration: '2 hours',
    distanceFromPrevious: '72 km',
    costLKR: 2000,
    rating: 4.7,
    reviewsCount: 8900,
    openingHours: '5:30 AM - 8:00 PM',
    coordinates: [7.2936, 80.6413],
    highlights: ['Golden Canopy', 'Royal Palace', 'Octagon (Paththirippuwa)', 'Daily Rituals']
  },
  {
    id: '3',
    name: 'Nine Arch Bridge',
    category: TravelStyle.ADVENTURE,
    description: 'The Nine Arch Bridge in Ella is one of the best examples of colonial-era railway construction in the country. The construction of the bridge is generally attributed to a local Ceylonese builder, P. K. Appuhami, in consultation with British engineers.',
    image: 'https://picsum.photos/seed/ella/800/600',
    duration: '1.5 hours',
    distanceFromPrevious: '140 km',
    costLKR: 0,
    rating: 4.9,
    reviewsCount: 15600,
    openingHours: 'Open 24/7',
    coordinates: [6.8768, 81.0608],
    highlights: ['Viaduct structure', 'Tea plantation views', 'Train spotting', 'Photography hotspots']
  },
  {
    id: '4',
    name: 'Galle Dutch Fort',
    category: TravelStyle.CULTURAL,
    description: 'The Galle Fort in the Bay of Galle on the southwest coast of Sri Lanka was built first in 1588 by the Portuguese, then extensively fortified by the Dutch during the 17th century from 1649 onwards.',
    image: 'https://picsum.photos/seed/galle/800/600',
    duration: '3 hours',
    distanceFromPrevious: '210 km',
    costLKR: 0,
    rating: 4.6,
    reviewsCount: 9200,
    openingHours: 'Open 24/7',
    coordinates: [6.0270, 80.2170],
    highlights: ['Lighthouse', 'Old Dutch Hospital', 'Boutique shops', 'Sunset on the ramparts']
  },
  {
    id: '5',
    name: 'Yala National Park',
    category: TravelStyle.NATURE,
    description: 'Yala National Park is the most visited and second largest national park in Sri Lanka. The park is best known for its variety of wild animals. It is important for the conservation of Sri Lankan elephants, Sri Lankan leopards and aquatic birds.',
    image: 'https://picsum.photos/seed/yala/800/600',
    duration: '5-6 hours',
    distanceFromPrevious: '120 km',
    costLKR: 15000,
    rating: 4.7,
    reviewsCount: 11200,
    openingHours: '6:00 AM - 6:00 PM',
    coordinates: [6.3754, 81.5125],
    highlights: ['Leopard spotting', 'Elephant herds', 'Sloth bears', 'Bird watching']
  },
  {
    id: '6',
    name: 'Polonnaruwa Vatadage',
    category: TravelStyle.CULTURAL,
    description: 'An ancient structure dating back to the Kingdom of Polonnaruwa of Sri Lanka. It is believed to have been built during the reign of Parakramabahu I to house the Relic of the tooth of the Buddha or during the reign of Nissanka Malla to house the alms bowl used by the Buddha.',
    image: 'https://picsum.photos/seed/polonnaruwa/800/600',
    duration: '4 hours',
    distanceFromPrevious: '55 km',
    costLKR: 8500,
    rating: 4.5,
    reviewsCount: 6700,
    openingHours: '7:30 AM - 6:00 PM',
    coordinates: [7.9403, 81.0011],
    highlights: ['Gal Vihara', 'Royal Palace', 'Lotus Pond', 'Parakrama Samudra']
  }
];
