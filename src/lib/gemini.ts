import { supabase } from './supabase';

export async function chatWithAI(
  prompt: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  useSearch: boolean = true
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const response = await fetch('/api/ai/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt, history, use_search: useSearch })
    });


    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la communication avec l\'IA');
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    throw error;
  }
}

export async function generateLegalDocument(type: string, details: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const response = await fetch('/api/ai/generate-document/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, details })
    });


    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la génération du document');
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('AI Document Error:', error);
    throw error;
  }
}

export async function analyzeAndSuggestActions(_context: any) {
  // Simple suggestion fallback or we could add another proxy endpoint
  return null;
}
