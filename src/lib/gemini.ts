import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAIResponse(
  prompt: string,
  context: {
    personality: any;
    setting: string;
    conversationHistory?: { role: string; content: string }[];
  }
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Filter and format history - Gemini requires history to start with 'user' role
    let history = context.conversationHistory?.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) || [];

    // Remove the first message if it's from AI (opening line)
    if (history.length > 0 && history[0].role === 'model') {
      history = history.slice(1);
    }

    // If history is now empty or doesn't start with user, start fresh
    if (history.length === 0 || history[0].role !== 'user') {
      history = [];
    }

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 200,
      },
    });

    const fullPrompt = `
      You are roleplaying as ${context.personality.name}.
      Personality: ${context.personality.traits}
      Tone: ${context.personality.tone}
      Setting: ${context.setting}
      
      You are having a conversation with someone in this setting. This is an ongoing conversation.
      Respond naturally to their latest message. Keep it conversational and realistic.
      Maximum 2-3 sentences per response.
      
      User says: "${prompt}"
    `;

    const result = await chat.sendMessage(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I'm having trouble responding right now. Could you try again?";
  }
}

export async function generateFeedback(
  userMessage: string,
  aiResponse: string,
  context: {
    scenario: string;
    personality: any;
    conversationHistory?: { role: 'user' | 'ai'; content: string }[];
  }
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const feedbackPrompt = `
      You are a concise, encouraging social-skills coach.
      Analyze this exchange and return STRICT JSON only (no markdown fences):

      Schema:
      {
        "rating": "good"|"neutral"|"improve",
        "message": string,  // 1-2 sentences of feedback
        "suggestions": string[] // 2-4 short actionable tips
      }

      Inputs:
      Scenario: ${context.scenario}
      Persona: ${context.personality.name}
      User: "${userMessage}"
      Persona reply: "${aiResponse}"
      Recent conversation (JSON): ${JSON.stringify((context.conversationHistory || []).slice(-6))}

      Make suggestions that are specific to the user’s latest message and this recent context.
      Return only the JSON.
    `;

    const result = await model.generateContent(feedbackPrompt);
    const responseText = result.response.text().trim();
    
    // Robustly parse JSON (handles accidental code fences or prose)
    const parsed = safeExtractJSON(responseText);
    if (parsed && parsed.rating && parsed.message && parsed.suggestions) {
      return parsed;
    }

      return {
        rating: 'neutral',
      message: typeof responseText === 'string' ? responseText.replace(/```[\s\S]*?```/g, '').trim() : 'Nice effort.',
        suggestions: ['Keep practicing!', 'Try asking more questions.']
      };
  } catch (error) {
    console.error('Feedback API Error:', error);
    return {
      rating: 'neutral',
      message: 'Thanks for practicing!',
      suggestions: ['Great effort!', 'Keep it up!']
    };
  }
}

/**
 * Generates an AI-powered opening line for conversation scenarios.
 *
 * Creates contextually appropriate conversation starters based on the
 * scenario setting and target persona characteristics.
 *
 * @param context Scenario and persona context for generating opening line
 * @returns Promise resolving to suggested opening line text
 * @example
 * ```typescript
 * const opening = await generateOpeningLine({
 *   scenario: "Coffee shop encounter",
 *   personality: { name: "Emma", traits: "friendly, bookworm" }
 * });
 * ```
 */
/**
 * Generates a scene description for the roleplay scenario.
 *
 * @param context Scenario context including setting, personality, and scenario details
 * @returns A detailed scene description setting up the roleplay environment
 * @example
 * ```typescript
 * const scene = await generateSceneDescription({
 *   scenario: "Coffee Shop Encounter",
 *   personality: emma,
 *   setting: "A cozy coffee shop"
 * });
 * ```
 */
export async function generateSceneDescription(context: {
  scenario: string;
  personality: any;
  setting: string;
}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const scenePrompt = `
      Create a vivid scene description for this roleplay scenario:
      
      Setting: ${context.setting}
      Scenario: ${context.scenario}
      Character: ${context.personality.name} - ${context.personality.occupation}
      Character traits: ${context.personality.traits}
      Character interests: ${context.personality.interests.join(', ')}
      Character backstory: ${context.personality.backstory}
      
      Write a scene description that:
      1. Sets the environment and mood
      2. Describes where ${context.personality.name} is and what they're doing
      3. Creates an opportunity for natural conversation
      4. Uses vivid but concise language (2-3 sentences max)
      
      Format: "You walk into [location]. You notice [character description and activity]. [Additional context that creates conversation opportunity]."
      
      Just return the scene description, nothing else.
    `;

    const result = await model.generateContent(scenePrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Scene Description API Error:', error);
    
    // Provide personality-specific fallback scenes
    const fallbacks: { [key: string]: string } = {
      'emma-bookworm': "You walk into the cozy coffee shop, the aroma of fresh brew filling the air. In a corner by the window, you spot Emma, a thoughtful young woman with dark hair, completely absorbed in a thick novel while sipping her latte. The afternoon light creates a perfect reading atmosphere, and there's an empty chair at the nearby table.",
      'alex-fitness': "You're walking through the park on this beautiful morning when you notice Alex stretching by the jogging path. He's wearing athletic gear and has a friendly, energetic demeanor as he prepares for his run. The park is peaceful, with just a few other early risers enjoying the fresh air.",
      'sophie-artist': "You enter the art supply store and immediately notice Sophie examining different paintbrushes with intense focus. She has paint stains on her fingers and a creative energy about her as she carefully selects her materials. The store is quiet, perfect for a conversation about art.",
      'marcus-tech': "You're in the tech café working on your laptop when you notice Marcus at a nearby table, surrounded by gadgets and typing away on what looks like an impressive setup. He occasionally glances around with curiosity, clearly someone who appreciates good technology. The café has a modern, innovative atmosphere.",
      'default': `You find yourself in ${context.setting} where you notice ${context.personality.name}, who appears to be ${context.personality.traits.split(',')[0]}. The environment feels welcoming and perfect for starting a conversation.`
    };
    
    return fallbacks[context.personality.id] || fallbacks['default'];
  }
}

/**
 * Generates coaching tips for approaching the character in the scenario.
 *
 * @param context Scenario context including setting, personality, and scenario details
 * @returns Practical coaching tips for starting the conversation
 * @example
 * ```typescript
 * const tips = await generateCoachingTips({
 *   scenario: "Coffee Shop Encounter",
 *   personality: emma,
 *   setting: "A cozy coffee shop"
 * });
 * ```
 */
export type TCoachingTips = {
  tone: string;
  principles: string[];
  suggestedOpeners: string[];
  pitfallsToAvoid: string[];
};

function safeExtractJSON(text: string): any {
  try {
    // Extract first JSON block if model wrapped it
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = text.slice(start, end + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function generateCoachingTips(context: {
  scenario: string;
  personality: any;
  setting: string;
}): Promise<TCoachingTips> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const tipsPrompt = `
      You are a social-skills coach. Generate coaching guidance as STRICT JSON only.
      DO NOT include markdown fences or any extra text.

      Schema:
      {
        "tone": string, // short guidance like "warm and curious"
        "principles": string[], // 3-5 short principles
        "suggestedOpeners": string[], // 3-5 natural opening lines tailored to the scene
        "pitfallsToAvoid": string[] // 3-5 common mistakes to avoid in this setting
      }

      Inputs:
      Character: ${context.personality.name} - ${context.personality.occupation}
      Traits: ${context.personality.traits}
      Interests: ${context.personality.interests.join(', ')}
      Setting: ${context.setting}
      Scenario: ${context.scenario}

      Return strictly a single JSON object following the schema.
    `;

    const result = await model.generateContent(tipsPrompt);
    const text = result.response.text().trim();
    const parsed = safeExtractJSON(text);

    if (parsed && parsed.principles && parsed.suggestedOpeners && parsed.pitfallsToAvoid) {
      return parsed as TCoachingTips;
    }

    // Fallback minimal object if parsing failed
    return {
      tone: 'friendly and respectful',
      principles: [
        'Start with something relevant to the setting',
        'Be authentic and show genuine interest',
        'Give space for the other person to respond'
      ],
      suggestedOpeners: [
        `Hey ${context.personality.name}, mind if I ask what you\'re reading?`,
        'This place has a great vibe today, right?',
        'I\'ve been looking for book recommendations—any favorites?'
      ],
      pitfallsToAvoid: [
        'Speaking too loudly in a quiet space',
        'Forcing the conversation if they seem busy',
        'Opening with generic compliments that feel insincere'
      ]
    };
  } catch (error) {
    console.error('Coaching Tips API Error:', error);
    return {
      tone: 'warm and curious',
      principles: [
        'Approach gently and be mindful of the environment',
        'Show curiosity about what they\'re doing',
        'Keep it brief and natural at first'
      ],
      suggestedOpeners: [
        'Hi—this might be random, but your book choice looks interesting. What is it?',
        'Is this a good spot for reading? I\'m trying to find a cozy corner.',
        'I\'m looking for new authors—got a favorite?'
      ],
      pitfallsToAvoid: [
        'Interrupting abruptly',
        'Standing too close without invitation',
        'Overly personal questions right away'
      ]
    };
  }
}