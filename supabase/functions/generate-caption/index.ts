import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CaptionRequest {
  content: string
  tone: string
  platform: string
  includeHashtags: boolean
  hashtagCount?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, tone, platform, includeHashtags, hashtagCount = 5 }: CaptionRequest = await req.json()

    if (!content || !tone || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create platform-specific prompt
    const platformInstructions = {
      instagram: 'Instagram post (engaging, visual-focused, use emojis)',
      twitter: 'Twitter post (concise, under 280 characters, trending)',
      facebook: 'Facebook post (conversational, community-focused)',
      linkedin: 'LinkedIn post (professional, industry-focused)',
      tiktok: 'TikTok caption (trendy, youth-focused, viral potential)'
    }

    const toneInstructions = {
      funny: 'humorous and entertaining',
      professional: 'professional and polished',
      romantic: 'romantic and heartfelt',
      motivational: 'inspiring and motivational',
      casual: 'casual and friendly',
      inspirational: 'uplifting and inspirational'
    }

    let prompt = `Write an engaging ${platformInstructions[platform as keyof typeof platformInstructions]} caption in a ${toneInstructions[tone as keyof typeof toneInstructions]} tone for this content: "${content}".`

    if (includeHashtags) {
      prompt += ` Also suggest ${hashtagCount} relevant hashtags. Format your response as:

CAPTION:
[Your caption here]

HASHTAGS:
[hashtag1, hashtag2, hashtag3, etc.]`
    } else {
      prompt += ' Do not include hashtags in your response.'
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert who creates engaging captions for various platforms. Always follow the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    let caption = aiResponse
    let hashtags: string[] = []

    if (includeHashtags && aiResponse.includes('HASHTAGS:')) {
      const parts = aiResponse.split('HASHTAGS:')
      caption = parts[0].replace('CAPTION:', '').trim()
      
      const hashtagsText = parts[1].trim()
      hashtags = hashtagsText
        .split(',')
        .map(tag => tag.trim().replace(/[#\[\]]/g, ''))
        .filter(tag => tag.length > 0)
        .slice(0, hashtagCount)
    } else {
      caption = aiResponse.replace('CAPTION:', '').trim()
    }

    return new Response(
      JSON.stringify({
        caption,
        hashtags,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error generating caption:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate caption',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})