import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, systemPrompt, model = 'gpt-4o', provider = 'openai' } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY') || '';
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';

    let generatedText = '';

    // 1. OpenAI (Default / Primary)
    if ((provider === 'openai' || provider === 'francejustice' || !provider) && openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: model.startsWith('gpt') ? model : 'gpt-4o',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ],
            temperature: 0.3
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('OpenAI backend call error:', err);
      }
    }

    // 2. Anthropic Claude (Fallback or Explicit)
    if (!generatedText && (provider === 'anthropic' || provider === 'francejustice') && anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model.startsWith('claude') ? model : 'claude-3-5-sonnet-20241022',
            max_tokens: 3000,
            system: systemPrompt || undefined,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.content?.[0]?.text || '';
        }
      } catch (err) {
        console.error('Anthropic backend call error:', err);
      }
    }

    // 3. Google Gemini (Fallback or Explicit)
    if (!generatedText && geminiKey) {
      try {
        const geminiModel = model.includes('pro') ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: (systemPrompt ? systemPrompt + '\n\n' : '') + prompt }] }],
              generationConfig: { temperature: 0.35, maxOutputTokens: 3000 }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch (err) {
        console.error('Gemini backend call error:', err);
      }
    }

    if (!generatedText) {
      return new Response(
        JSON.stringify({ text: '', error: 'No backend LLM response', is_fallback_trigger: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ text: generatedText, is_fallback_trigger: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Server error', is_fallback_trigger: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
