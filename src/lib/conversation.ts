import { createClient } from './supabase/client'

export interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

export async function createConversation(
  userId: string,
  scenarioId: string,
  openingLine: string
): Promise<string | null> {
  try {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      scenario_id: scenarioId,
      started_at: new Date().toISOString(),
      messages: [
        {
          role: 'ai',
          content: openingLine,
          timestamp: new Date().toISOString()
        }
      ],
      completed: false
    })
    .select('id')
    .single()

  if (error) {
    // Log minimal to avoid noisy console, return null
    console.error('Error creating conversation:', {
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code,
    })
    return null
  }

  return data.id
  } catch (error) {
    console.error('Supabase connection error while creating conversation:', {
      message: (error as any)?.message,
    })
    // Return a mock conversation ID if Supabase isn't available
    return `mock-conversation-${Date.now()}`;
  }
}

export async function addMessageToConversation(
  conversationId: string,
  message: Message
): Promise<boolean> {
  try {
    // Skip if it's a mock conversation ID
    if (conversationId.startsWith('mock-conversation-')) {
      console.log('Skipping message save for mock conversation:', message.content.substring(0, 50));
      return true;
    }

  const supabase = createClient()
  
  // First, get current messages
  const { data: conversation, error: fetchError } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  if (fetchError) {
    console.error('Error fetching conversation:', {
      message: (fetchError as any)?.message,
      details: (fetchError as any)?.details,
      hint: (fetchError as any)?.hint,
      code: (fetchError as any)?.code,
    })
    return false
  }

  const currentMessages = conversation.messages || []
  const updatedMessages = [...currentMessages, message]

  // Update with new messages
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ messages: updatedMessages })
    .eq('id', conversationId)

  if (updateError) {
    console.error('Error updating conversation:', {
      message: (updateError as any)?.message,
      details: (updateError as any)?.details,
      hint: (updateError as any)?.hint,
      code: (updateError as any)?.code,
    })
    return false
  }

  return true
  } catch (error) {
    console.error('Supabase connection error while adding message:', {
      message: (error as any)?.message,
    })
    return false;
  }
}

export async function saveConversationFeedback(
  conversationId: string,
  feedback: any
): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('conversations')
    .update({ 
      feedback,
      completed: true,
      ended_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (error) {
    console.error('Error saving feedback:', {
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code,
    })
    return false
  }

  return true
}