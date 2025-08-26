-- Sample Data for WingMan AI Database
-- Run this AFTER the main migration to add some basic test data
-- This will help with testing and prevent foreign key constraint errors

-- Insert basic personas (required for scenarios)
INSERT INTO personas (id, name, age, occupation, communication_style, background, personality_traits, interests) VALUES
('emma', 'Emma', 28, 'Barista', 'friendly', 'A warm and welcoming coffee shop worker who loves meeting new people and discussing favorite drinks.', 
 ARRAY['outgoing', 'patient', 'curious'], ARRAY['coffee', 'music', 'travel']),
 
('alex', 'Alex', 24, 'Personal Trainer', 'energetic', 'A fitness enthusiast who motivates others to reach their health goals through positive encouragement.', 
 ARRAY['motivational', 'energetic', 'health-conscious'], ARRAY['fitness', 'nutrition', 'outdoor activities']),
 
('sam', 'Sam', 32, 'Bookstore Owner', 'intellectual', 'A literature lover who enjoys deep conversations about books, philosophy, and creative writing.', 
 ARRAY['thoughtful', 'well-read', 'analytical'], ARRAY['literature', 'philosophy', 'writing']),
 
('jordan', 'Jordan', 26, 'Bartender', 'social', 'A charismatic bartender who is great at reading people and creating a fun, relaxed atmosphere.', 
 ARRAY['charismatic', 'intuitive', 'fun-loving'], ARRAY['mixology', 'people-watching', 'nightlife']),
 
('taylor', 'Taylor', 30, 'Park Ranger', 'calm', 'A nature enthusiast who finds peace in outdoor spaces and loves sharing knowledge about the environment.', 
 ARRAY['peaceful', 'knowledgeable', 'environmentally-conscious'], ARRAY['nature', 'hiking', 'conservation']),
 
('dr-chen', 'Dr. Chen', 45, 'Museum Curator', 'scholarly', 'An art and history expert who can discuss cultural topics with depth and passion.', 
 ARRAY['scholarly', 'passionate', 'cultured'], ARRAY['art history', 'museums', 'cultural studies'])
ON CONFLICT (id) DO NOTHING;

-- Insert basic scenarios (using the personas above)
INSERT INTO scenarios (id, title, description, setting, category, difficulty, is_premium, persona_id, image, context, objectives) VALUES
('cafe-1', 'Coffee Shop Conversation', 'Practice casual conversation in a relaxed coffee shop environment', 'Coffee Shop', 'social', 'beginner', false, 'emma', '/images/cafe.jpg', 
 'You are in a cozy coffee shop on a weekend afternoon. The barista Emma seems friendly and approachable as she makes your drink.',
 ARRAY['Start a casual conversation', 'Ask about coffee recommendations', 'Share something about yourself']),

('gym-1', 'Gym Introduction', 'Practice introducing yourself and asking for fitness advice', 'Gym', 'social', 'intermediate', false, 'alex', '/images/gym.jpg',
 'You are at a local gym and notice Alex, a personal trainer, nearby. This could be a good opportunity to ask for some fitness advice.',
 ARRAY['Introduce yourself confidently', 'Ask for workout advice', 'Show interest in fitness goals']),

('bookstore-1', 'Bookstore Browse', 'Practice conversations about literature and get book recommendations', 'Bookstore', 'intellectual', 'beginner', false, 'sam', '/images/bookstore.jpg',
 'You are browsing in an independent bookstore. Sam, the owner, notices you looking at the philosophy section.',
 ARRAY['Discuss book preferences', 'Ask for recommendations', 'Share your reading interests']),

('bar-1', 'Bar Social Hour', 'Practice social interactions in a lively bar setting', 'Bar', 'social', 'advanced', true, 'jordan', '/images/bar.jpg',
 'You are at a popular local bar during happy hour. Jordan, the bartender, is mixing drinks and seems open to conversation.',
 ARRAY['Order confidently', 'Make casual conversation', 'Read social cues']),

('park-1', 'Nature Walk Connection', 'Practice mindful conversation during a peaceful park walk', 'Park', 'mindful', 'beginner', false, 'taylor', '/images/park.jpg',
 'You are on a walking trail in a beautiful park. Taylor, a park ranger, is nearby and seems knowledgeable about the area.',
 ARRAY['Ask about the park', 'Show appreciation for nature', 'Practice active listening']),

('museum-1', 'Museum Gallery Discussion', 'Practice intellectual conversations about art and culture', 'Museum', 'intellectual', 'intermediate', true, 'dr-chen', '/images/museum.jpg',
 'You are visiting a museum gallery. Dr. Chen, the curator, is giving an informal talk about the current exhibition.',
 ARRAY['Ask thoughtful questions', 'Discuss art appreciation', 'Engage in intellectual dialogue'])
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted correctly
SELECT 
  s.id,
  s.title,
  s.difficulty,
  s.is_premium,
  p.name as persona_name,
  p.occupation
FROM scenarios s
JOIN personas p ON s.persona_id = p.id
ORDER BY s.difficulty, s.id;

-- Show summary
SELECT 
  'Sample Data Summary' as info,
  (SELECT COUNT(*) FROM personas) as total_personas,
  (SELECT COUNT(*) FROM scenarios) as total_scenarios,
  (SELECT COUNT(*) FROM scenarios WHERE is_premium = false) as free_scenarios,
  (SELECT COUNT(*) FROM scenarios WHERE is_premium = true) as premium_scenarios;
