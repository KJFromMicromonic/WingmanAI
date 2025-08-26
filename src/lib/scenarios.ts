export interface Scenario {
  id: string;
  title: string;
  description: string;
  setting: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPremium: boolean;
  image: string;
  category: string;
  personaId: string;
  tags: string[];
}

/**
 * Collection of predefined practice scenarios for social interaction training.
 * 
 * Each scenario provides a realistic social situation where users can practice
 * conversation skills with AI personas in various settings and contexts.
 */
const scenarios: Scenario[] = [
  {
    id: 'cafe-1',
    title: 'Cafe Rendezvous',
    description: 'Practice casual conversation with someone reading in a cozy café',
    setting: 'A warm, bustling coffee shop with soft jazz music playing',
    difficulty: 'beginner',
    isPremium: false,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    category: 'Casual',
    personaId: 'emma-bookworm',
    tags: ['coffee', 'books', 'casual', 'daytime']
  },
  {
    id: 'park-1',
    title: 'Park Walk',
    description: 'Build connection during a casual outdoor encounter',
    setting: 'A sunny park with walking trails and people exercising',
    difficulty: 'beginner',
    isPremium: false,
    image: 'https://images.unsplash.com/photo-1585938389612-a552a28d6914?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Casual',
    personaId: 'alex-fitness',
    tags: ['outdoors', 'exercise', 'healthy', 'morning']
  },
  {
    id: 'bookstore-1',
    title: 'Bookstore Browse',
    description: 'Strike up a conversation about shared literary interests',
    setting: 'A quiet independent bookstore with tall shelves and reading nooks',
    difficulty: 'beginner',
    isPremium: false,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    category: 'Intellectual',
    personaId: 'maya-literary',
    tags: ['books', 'quiet', 'intellectual', 'afternoon']
  },
  {
    id: 'bar-1',
    title: 'Bar Pickup',
    description: 'Navigate a loud, social environment with confidence',
    setting: 'A trendy bar with music, dancing, and social energy',
    difficulty: 'intermediate',
    isPremium: true,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
    category: 'Social',
    personaId: 'jordan-social',
    tags: ['nightlife', 'music', 'social', 'evening']
  },
  {
    id: 'gym-1',
    title: 'Gym Approach',
    description: 'Start a conversation in a fitness-focused environment',
    setting: 'A modern gym with equipment, mirrors, and fitness enthusiasts',
    difficulty: 'intermediate',
    isPremium: true,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    category: 'Fitness',
    personaId: 'taylor-athlete',
    tags: ['fitness', 'health', 'motivation', 'workout']
  },
  {
    id: 'museum-1',
    title: 'Museum Gallery',
    description: 'Connect over art and culture in a sophisticated setting',
    setting: 'An art museum with beautiful paintings and sculptures',
    difficulty: 'advanced',
    isPremium: true,
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    category: 'Cultural',
    personaId: 'morgan-artist',
    tags: ['art', 'culture', 'sophisticated', 'weekend']
  }
];

/**
 * Retrieves all available scenarios.
 * 
 * @returns Array of all scenario objects
 */
export function getAllScenarios(): Scenario[] {
  return scenarios;
}

/**
 * Retrieves scenarios filtered by difficulty level.
 * 
 * @param difficulty Difficulty level to filter by
 * @returns Array of scenarios matching the difficulty
 */
export function getScenariosByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Scenario[] {
  return scenarios.filter(scenario => scenario.difficulty === difficulty);
}

/**
 * Retrieves all free (non-premium) scenarios.
 * 
 * @returns Array of free scenario objects
 */
export function getFreeScenarios(): Scenario[] {
  return scenarios.filter(scenario => !scenario.isPremium);
}

/**
 * Retrieves all premium scenarios.
 * 
 * @returns Array of premium scenario objects
 */
export function getPremiumScenarios(): Scenario[] {
  return scenarios.filter(scenario => scenario.isPremium);
}

/**
 * Retrieves scenarios filtered by category.
 * 
 * @param category Category to filter by
 * @returns Array of scenarios in the specified category
 */
export function getScenariosByCategory(category: string): Scenario[] {
  return scenarios.filter(scenario => scenario.category === category);
}

/**
 * Retrieves a specific scenario by its ID.
 * 
 * @param id Unique identifier for the scenario
 * @returns Scenario object if found, undefined otherwise
 */
export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find(scenario => scenario.id === id);
}

/**
 * Searches scenarios by title, description, or tags.
 * 
 * @param query Search query string
 * @returns Array of scenarios matching the search criteria
 */
export function searchScenarios(query: string): Scenario[] {
  const lowerQuery = query.toLowerCase();
  return scenarios.filter(scenario => 
    scenario.title.toLowerCase().includes(lowerQuery) ||
    scenario.description.toLowerCase().includes(lowerQuery) ||
    scenario.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}