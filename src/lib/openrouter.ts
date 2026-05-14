import { parseAIJson } from './ai-helpers'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Strip markdown code blocks (```json ... ``` or ``` ... ```) from AI responses
function stripCodeBlocks(text: string): string {
  return text.replace(/^```(?:json|JSON)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim()
}

/**
 * Resilient JSON parser used across all AI helpers.
 * 3-strategy fallback (raw → stripped fences → first {..last}).
 */
export function parseAIResponse<T>(text: string, fallback: T): T {
  const parsed = parseAIJson<T>(text)
  return parsed === null ? fallback : parsed
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function callOpenRouter(
  messages: Message[],
  options?: {
    maxTokens?: number
    temperature?: number
    model?: string
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = options?.model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'PetGroom Pro',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens || 10000,
      temperature: options?.temperature || 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenRouter API error:', error)
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data: OpenRouterResponse = await response.json()
  const content = data.choices[0]?.message?.content || ''
  return stripCodeBlocks(content)
}

// Vision-capable function for image analysis
export async function callOpenRouterVision(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  // Use a vision-capable model
  const visionModel = process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-3-5-sonnet-20241022'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'PetGroom Pro',
    },
    body: JSON.stringify({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ],
      max_tokens: 10000,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenRouter Vision API error:', error)
    throw new Error(`OpenRouter Vision API error: ${response.status}`)
  }

  const data: OpenRouterResponse = await response.json()
  const content = data.choices[0]?.message?.content || ''
  return stripCodeBlocks(content)
}

export async function identifyBreed(imageBase64: string): Promise<{
  breed: string
  confidence: number
  alternativeBreeds: string[]
  characteristics: string[]
}> {
  const prompt = `You are an expert veterinarian and dog/cat breed identifier. Look at this pet image and identify the breed.

Respond ONLY with valid JSON in this exact format (no other text):
{
  "breed": "Primary breed name",
  "confidence": 0.85,
  "alternativeBreeds": ["Alternative breed 1", "Alternative breed 2"],
  "characteristics": ["Key characteristic 1", "Key characteristic 2", "Key characteristic 3"]
}

Be specific and accurate. Include 2-3 alternative breeds that it could be. List 3-4 visible characteristics of the pet. If it appears to be a mixed breed, say "Mixed Breed" with the likely mix in parentheses.`

  try {
    const response = await callOpenRouterVision(imageBase64, prompt)

    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('Breed identification parse error:', error)
    return {
      breed: 'Unknown',
      confidence: 0.5,
      alternativeBreeds: [],
      characteristics: [],
    }
  }
}

export async function suggestGroomingStyles(
  breed: string,
  coatType?: string,
  preferences?: string
): Promise<{
  styles: Array<{
    name: string
    description: string
    difficulty: string
    maintenanceLevel: string
    bestFor: string
    groomingFrequency: string
    toolsRequired: string[]
  }>
}> {
  const prompt = `You are a professional pet groomer with 20 years of experience specializing in ${breed}s. Suggest grooming styles for a ${breed}${coatType ? ` with ${coatType} coat` : ''}.
${preferences ? `Client preferences: ${preferences}` : ''}

Provide 4-5 detailed grooming style recommendations that are specifically suitable for this breed. Include popular show cuts, practical everyday styles, and creative options.

For each style, provide a thorough description (3-4 sentences) explaining the look, how it's achieved, and why it works for this breed.

Respond in JSON format only:
{
  "styles": [
    {
      "name": "Style Name",
      "description": "Detailed description (3-4 sentences) of the cut, how it looks, the technique involved, and why it suits this breed's coat texture and body shape",
      "difficulty": "Easy/Medium/Hard",
      "maintenanceLevel": "Low/Medium/High",
      "bestFor": "Who this style is best for (e.g., active dogs, show dogs, hot climates)",
      "groomingFrequency": "How often this style needs maintenance (e.g., every 4-6 weeks)",
      "toolsRequired": ["Tool 1", "Tool 2", "Tool 3"]
    }
  ]
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a professional pet groomer. Always respond with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(response)
  } catch {
    return {
      styles: [
        {
          name: 'Standard Breed Cut',
          description: 'Classic breed-appropriate grooming style',
          difficulty: 'Medium',
          maintenanceLevel: 'Medium',
          bestFor: 'All pet owners',
          groomingFrequency: 'Every 4-6 weeks',
          toolsRequired: ['Clippers', 'Scissors', 'Brush'],
        },
      ],
    }
  }
}

export async function generateSocialPost(
  petName: string,
  breed: string,
  serviceType: string,
  additionalContext?: string
): Promise<{
  post: string
  hashtags: string[]
  platform: string
  alternativePost: string
  engagementTip: string
}> {
  const prompt = `You are an experienced social media manager for a popular pet grooming salon with 50K followers. Create an engaging social media post about a ${breed} named ${petName} who just got a ${serviceType}.
${additionalContext ? `Additional context: ${additionalContext}` : ''}

The post should be:
- Fun, engaging, and emotionally appealing (make people want to comment!)
- Include relevant emojis throughout
- Tell a mini-story about the pet's grooming journey
- Be appropriate for Instagram/Facebook
- Highlight the transformation and how the pet feels
- Include a call to action or question to boost engagement
- Be 3-5 sentences long

Respond in JSON format only:
{
  "post": "The engaging social media post text (3-5 sentences) with emojis, personality, and a call to action",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8"],
  "platform": "Instagram",
  "alternativePost": "A shorter alternative version for Twitter/X (under 280 characters)",
  "engagementTip": "A tip for when to post this for maximum engagement"
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a creative social media manager for a pet grooming business. Always respond with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(response)
  } catch {
    return {
      post: `${petName} the ${breed} is looking fabulous after their ${serviceType}! Fresh, clean, and ready to turn heads!`,
      hashtags: ['PetGrooming', 'DogGrooming', 'FreshlyGroomed', 'PetSpa', 'DogsOfInstagram'],
      platform: 'Instagram',
      alternativePost: `${petName} looking fabulous after ${serviceType}!`,
      engagementTip: 'Post during lunch hours for maximum engagement',
    }
  }
}

export async function generateAppointmentReminder(
  clientName: string,
  petName: string,
  lastVisitDate: string,
  recommendedServices?: string[]
): Promise<{
  message: string
  subject: string
  tone: string
  smsVersion: string
  followUpDate: string
}> {
  const prompt = `You are a friendly and personable customer service representative for a premium pet grooming salon. Create a personalized appointment reminder message for:

Client: ${clientName}
Pet: ${petName}
Last Visit: ${lastVisitDate}
${recommendedServices ? `Recommended Services: ${recommendedServices.join(', ')}` : ''}

The message should be:
- Warm, friendly, and genuinely caring about the pet
- Highly personalized - mention the pet's name multiple times
- Include specific benefits of regular grooming for the pet's health and happiness
- Reference the time since last visit in a gentle way
- Include a clear but non-pushy call to action to book
- Be 4-6 sentences with a warm greeting and sign-off
- Feel like it's from someone who actually remembers and cares about ${petName}

Respond in JSON format only:
{
  "message": "The full reminder message (4-6 sentences) that feels personal and caring",
  "subject": "Catchy email subject line that mentions ${petName}",
  "tone": "Friendly",
  "smsVersion": "A shorter SMS-friendly version (under 160 characters)",
  "followUpDate": "Suggested follow-up timing if no response (e.g., '3 days')"
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a friendly pet grooming salon customer service representative. Always respond with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(response)
  } catch {
    return {
      message: `Hi ${clientName}! It's been a while since ${petName}'s last visit. We'd love to see you both again! Book your next appointment with us.`,
      subject: `Time for ${petName}'s grooming appointment!`,
      tone: 'Friendly',
      smsVersion: `Hi ${clientName}! Time for ${petName}'s grooming. Book now!`,
      followUpDate: '3 days',
    }
  }
}

export async function analyzeHealthConcerns(
  symptoms: string,
  petType: string,
  breed: string
): Promise<{
  concerns: Array<{
    condition: string
    severity: string
    recommendation: string
    signsToWatch: string[]
    commonCauses: string[]
  }>
  shouldSeeVet: boolean
  generalAdvice: string
  breedSpecificNotes: string
  homeCareTips: string[]
}> {
  const prompt = `You are a veterinary assistant with 15 years of experience helping pet groomers identify potential health concerns. A groomer has noticed the following on a ${breed} (${petType}):

Observations: ${symptoms}

Provide a thorough analysis of potential concerns and detailed recommendations. Note that ${breed}s may have breed-specific sensitivities. This is guidance for the groomer, not a diagnosis.

Respond in JSON format only:
{
  "concerns": [
    {
      "condition": "Possible condition name",
      "severity": "Low/Medium/High",
      "recommendation": "Detailed recommendation (2-3 sentences) for what the groomer should do and what to communicate to the pet owner",
      "signsToWatch": ["Sign 1 that could indicate worsening", "Sign 2", "Sign 3"],
      "commonCauses": ["Possible cause 1", "Possible cause 2"]
    }
  ],
  "shouldSeeVet": true/false,
  "generalAdvice": "Comprehensive general advice for the groomer (2-3 sentences) about how to handle this situation professionally",
  "breedSpecificNotes": "Any notes specific to ${breed}s and their common skin/coat issues",
  "homeCareTips": ["Tip 1 for the pet owner", "Tip 2", "Tip 3"]
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a veterinary assistant providing guidance to pet groomers. Always respond with valid JSON. Be cautious and recommend vet visits when appropriate.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(response)
  } catch {
    return {
      concerns: [],
      shouldSeeVet: true,
      generalAdvice: 'When in doubt, recommend the pet owner consult with a veterinarian.',
      breedSpecificNotes: 'Consult breed-specific guidelines for more information.',
      homeCareTips: ['Keep the area clean', 'Monitor for changes', 'Consult a vet if symptoms persist'],
    }
  }
}

export async function suggestUpsells(
  currentServices: string[],
  petBreed: string,
  petCondition?: string
): Promise<{
  suggestions: Array<{
    service: string
    reason: string
    priority: string
    benefits: string[]
    price: string
  }>
}> {
  const prompt = `You are an experienced pet grooming consultant with deep knowledge of breed-specific needs. A ${petBreed} is booked for: ${currentServices.join(', ')}.
${petCondition ? `Pet condition notes: ${petCondition}` : ''}

Suggest 4-5 additional services that would genuinely benefit this specific breed. For each suggestion, provide detailed reasoning about why this breed in particular would benefit.

Respond in JSON format only:
{
  "suggestions": [
    {
      "service": "Service name",
      "reason": "Detailed explanation (2-3 sentences) of why this ${petBreed} would benefit from this service, including breed-specific considerations",
      "priority": "High/Medium/Low",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "price": "$XX-$XX estimated"
    }
  ]
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a helpful pet grooming consultant. Always respond with valid JSON only, no other text.' },
    { role: 'user', content: prompt },
  ])

  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response)
  } catch (error) {
    console.error('Upsell suggestion parse error:', error, 'Response:', response)
    return {
      suggestions: [
        {
          service: 'De-shedding Treatment',
          reason: 'Helps reduce shedding and keeps coat healthy',
          priority: 'Medium',
          benefits: ['Reduces shedding', 'Healthier coat', 'Less cleanup at home'],
          price: '$20-$35',
        },
        {
          service: 'Teeth Brushing',
          reason: 'Promotes dental health and fresh breath',
          priority: 'Low',
          benefits: ['Fresh breath', 'Healthy gums', 'Prevents tartar'],
          price: '$10-$15',
        },
      ],
    }
  }
}

export async function estimateAppointment(
  breed: string,
  petSize: string,
  serviceType: string,
  coatCondition?: string
): Promise<{
  estimatedDuration: number
  difficultyLevel: string
  groomingTips: Array<{
    tip: string
    importance: string
  }>
  toolsNeeded: string[]
  warnings: string[]
  priceRange: {
    min: number
    max: number
  }
}> {
  const prompt = `You are an expert pet groomer with 20 years of experience. Estimate the appointment details for:

Breed: ${breed}
Size: ${petSize}
Service: ${serviceType}
${coatCondition ? `Coat Condition: ${coatCondition}` : ''}

Provide a detailed estimate including duration, difficulty, tips, tools, and pricing.

Respond ONLY with valid JSON in this exact format (no other text):
{
  "estimatedDuration": 60,
  "difficultyLevel": "Easy/Medium/Hard/Expert",
  "groomingTips": [
    {
      "tip": "Specific grooming tip for this breed",
      "importance": "High/Medium/Low"
    }
  ],
  "toolsNeeded": ["Tool 1", "Tool 2", "Tool 3"],
  "warnings": ["Any breed-specific warnings or cautions"],
  "priceRange": {
    "min": 50,
    "max": 80
  }
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are an expert pet groomer. Always respond with valid JSON. Base estimates on real-world grooming standards.' },
    { role: 'user', content: prompt },
  ])

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response)
  } catch {
    return {
      estimatedDuration: 60,
      difficultyLevel: 'Medium',
      groomingTips: [{ tip: 'Standard grooming procedures apply', importance: 'Medium' }],
      toolsNeeded: ['Clippers', 'Scissors', 'Brushes', 'Shampoo'],
      warnings: [],
      priceRange: { min: 50, max: 100 },
    }
  }
}

export async function generateClientMessage(
  messageType: string,
  clientName: string,
  petName: string,
  context?: string
): Promise<{
  subject: string
  message: string
  tone: string
  callToAction: string
}> {
  const prompt = `You are a professional pet grooming salon customer service representative. Generate a ${messageType} message for:

Client: ${clientName}
Pet: ${petName}
${context ? `Additional Context: ${context}` : ''}

Message types and their purpose:
- booking_confirmation: Confirm a new appointment
- reschedule_request: Politely request to reschedule
- cancellation: Inform about cancellation with empathy
- follow_up: Thank them after service, ask for review
- no_show: Gentle reminder about missed appointment
- waitlist_available: Notify about available slot
- service_complete: Let them know their pet is ready for pickup

The message should be:
- Professional but warm
- Include the pet's name
- Have a clear call to action
- Be appropriate length (not too long)

Respond ONLY with valid JSON in this exact format (no other text):
{
  "subject": "Email/SMS subject line",
  "message": "The full message content",
  "tone": "Friendly/Professional/Apologetic/Excited",
  "callToAction": "What you want them to do next"
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a friendly pet grooming salon representative. Always respond with valid JSON. Keep messages concise and professional.' },
    { role: 'user', content: prompt },
  ])

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response)
  } catch {
    return {
      subject: `Message regarding ${petName}`,
      message: `Hi ${clientName}, thank you for choosing our grooming services for ${petName}!`,
      tone: 'Friendly',
      callToAction: 'Contact us if you have any questions',
    }
  }
}

// AI Diet Recommender
export async function recommendDiet(
  petType: string,
  breed: string,
  age: string,
  weight: number,
  activityLevel: string,
  healthConditions?: string,
  currentDiet?: string
): Promise<{
  recommendations: Array<{
    category: string
    suggestion: string
    benefits: string[]
    brands?: string[]
    frequency: string
    portionSize: string
  }>
  dailyCalories: number
  hydrationTips: string[]
  supplementsNeeded: string[]
  foodsToAvoid: string[]
  feedingSchedule: {
    mealsPerDay: number
    bestTimes: string[]
    tips: string[]
  }
  specialConsiderations: string
}> {
  const prompt = `You are a certified pet nutritionist with 20 years of experience. Create a comprehensive diet recommendation for:

Pet Type: ${petType}
Breed: ${breed}
Age: ${age}
Weight: ${weight} lbs
Activity Level: ${activityLevel}
${healthConditions ? `Health Conditions: ${healthConditions}` : ''}
${currentDiet ? `Current Diet: ${currentDiet}` : ''}

Provide detailed, breed-specific nutritional advice. Consider the pet's age, weight, activity level, and any health conditions.

Respond ONLY with valid JSON in this exact format (no other text):
{
  "recommendations": [
    {
      "category": "Main Food/Protein/Treats/Supplements",
      "suggestion": "Detailed recommendation (2-3 sentences)",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "brands": ["Recommended brand 1", "Recommended brand 2"],
      "frequency": "How often to give this",
      "portionSize": "Recommended portion size"
    }
  ],
  "dailyCalories": 800,
  "hydrationTips": ["Tip 1", "Tip 2", "Tip 3"],
  "supplementsNeeded": ["Supplement 1 with reason", "Supplement 2 with reason"],
  "foodsToAvoid": ["Food 1 with reason", "Food 2 with reason"],
  "feedingSchedule": {
    "mealsPerDay": 2,
    "bestTimes": ["7:00 AM", "6:00 PM"],
    "tips": ["Feeding tip 1", "Feeding tip 2"]
  },
  "specialConsiderations": "Any breed-specific or condition-specific dietary notes"
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a certified pet nutritionist. Always respond with valid JSON only.' },
    { role: 'user', content: prompt },
  ])

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response)
  } catch {
    return {
      recommendations: [
        {
          category: 'Main Food',
          suggestion: 'High-quality protein-based diet appropriate for age and size',
          benefits: ['Supports muscle health', 'Provides essential nutrients'],
          frequency: 'Twice daily',
          portionSize: 'Based on weight and activity level',
        },
      ],
      dailyCalories: 800,
      hydrationTips: ['Always provide fresh water', 'Change water daily'],
      supplementsNeeded: [],
      foodsToAvoid: ['Chocolate', 'Grapes', 'Onions'],
      feedingSchedule: {
        mealsPerDay: 2,
        bestTimes: ['Morning', 'Evening'],
        tips: ['Maintain consistent feeding times'],
      },
      specialConsiderations: 'Consult with a veterinarian for personalized advice.',
    }
  }
}

// AI Behavior Analyzer
export async function analyzeBehavior(
  petType: string,
  breed: string,
  age: string,
  behaviorDescription: string,
  context?: string,
  frequency?: string
): Promise<{
  analysis: {
    behaviorType: string
    severity: string
    possibleCauses: string[]
    isNormal: boolean
    breedTypical: boolean
  }
  recommendations: Array<{
    approach: string
    description: string
    difficulty: string
    timeToResult: string
    steps: string[]
  }>
  trainingTips: Array<{
    tip: string
    importance: string
    category: string
  }>
  environmentalChanges: string[]
  professionalHelpNeeded: boolean
  professionalHelpReason?: string
  positiveReinforcement: string[]
  warningSignsToWatch: string[]
  expectedOutcome: string
}> {
  const prompt = `You are a certified animal behaviorist with 20 years of experience working with pets. Analyze the following behavior:

Pet Type: ${petType}
Breed: ${breed}
Age: ${age}
Behavior Description: ${behaviorDescription}
${context ? `Context/Situation: ${context}` : ''}
${frequency ? `How often this occurs: ${frequency}` : ''}

Provide a comprehensive behavioral analysis with actionable recommendations. Consider breed-specific tendencies and age-appropriate expectations.

Respond ONLY with valid JSON in this exact format (no other text):
{
  "analysis": {
    "behaviorType": "Category of behavior (e.g., Anxiety, Aggression, Fear, Attention-seeking)",
    "severity": "Low/Medium/High",
    "possibleCauses": ["Cause 1", "Cause 2", "Cause 3"],
    "isNormal": true/false,
    "breedTypical": true/false
  },
  "recommendations": [
    {
      "approach": "Training/Management/Environmental Modification",
      "description": "Detailed explanation of the approach (2-3 sentences)",
      "difficulty": "Easy/Medium/Hard",
      "timeToResult": "Expected time to see improvement",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "trainingTips": [
    {
      "tip": "Specific training tip",
      "importance": "High/Medium/Low",
      "category": "Basic Training/Behavior Modification/Socialization"
    }
  ],
  "environmentalChanges": ["Environmental change 1", "Environmental change 2"],
  "professionalHelpNeeded": true/false,
  "professionalHelpReason": "Reason why professional help might be needed (if applicable)",
  "positiveReinforcement": ["Reward method 1", "Reward method 2"],
  "warningSignsToWatch": ["Sign 1", "Sign 2"],
  "expectedOutcome": "What to expect with consistent training"
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a certified animal behaviorist. Always respond with valid JSON only.' },
    { role: 'user', content: prompt },
  ])

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(response)
  } catch {
    return {
      analysis: {
        behaviorType: 'Unknown',
        severity: 'Medium',
        possibleCauses: ['Unable to determine without more information'],
        isNormal: false,
        breedTypical: false,
      },
      recommendations: [
        {
          approach: 'Observation',
          description: 'Monitor the behavior and note any patterns or triggers',
          difficulty: 'Easy',
          timeToResult: '1-2 weeks',
          steps: ['Observe when behavior occurs', 'Note any triggers', 'Track frequency'],
        },
      ],
      trainingTips: [
        {
          tip: 'Use positive reinforcement',
          importance: 'High',
          category: 'Basic Training',
        },
      ],
      environmentalChanges: ['Ensure a calm environment'],
      professionalHelpNeeded: true,
      professionalHelpReason: 'Recommend consulting a professional for proper diagnosis',
      positiveReinforcement: ['Treats', 'Praise', 'Play'],
      warningSignsToWatch: ['Escalation of behavior', 'Aggression'],
      expectedOutcome: 'Improvement varies; professional guidance recommended',
    }
  }
}

export async function analyzePhotoForEnhancement(imageBase64: string): Promise<{
  qualityScore: number
  overallAssessment: string
  tips: Array<{
    category: string
    suggestion: string
    priority: string
  }>
  suggestedCaption: string
  hashtags: string[]
}> {
  const prompt = `You are a professional pet photographer and social media expert. Analyze this pet photo for quality and provide enhancement suggestions.

Evaluate the photo and provide:
1. A quality score from 1-10
2. Overall assessment of the photo
3. Specific tips for improvement (lighting, composition, background, focus, etc.)
4. A suggested caption for social media
5. Relevant hashtags

Respond ONLY with valid JSON in this exact format (no other text):
{
  "qualityScore": 7,
  "overallAssessment": "Brief overall assessment of the photo quality and appeal",
  "tips": [
    {
      "category": "Lighting/Composition/Background/Focus/Angle",
      "suggestion": "Specific improvement suggestion",
      "priority": "High/Medium/Low"
    }
  ],
  "suggestedCaption": "An engaging caption for social media",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`

  try {
    const response = await callOpenRouterVision(imageBase64, prompt)

    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return JSON.parse(response)
  } catch (error) {
    console.error('Photo enhancement parse error:', error)
    return {
      qualityScore: 5,
      overallAssessment: 'Unable to fully analyze the photo',
      tips: [
        {
          category: 'General',
          suggestion: 'Ensure good lighting and a clear view of the pet',
          priority: 'High',
        },
      ],
      suggestedCaption: 'Looking adorable!',
      hashtags: ['PetPhoto', 'CutePet', 'PetGrooming', 'FurryFriend', 'PetLove'],
    }
  }
}

// ============== VETERINARY AI TOOLS ==============

export async function veterinaryDiagnosis(
  species: string, breed: string, age: string, symptoms: string, history?: string
): Promise<{
  diagnoses: Array<{ condition: string; likelihood: string; description: string }>
  recommendedTests: string[]
  urgencyLevel: string
  additionalNotes: string
}> {
  const prompt = `Patient: ${species}${breed ? `, ${breed}` : ''}, ${age || 'unknown age'}
Symptoms: ${symptoms}
${history ? `Medical History: ${history}` : ''}

Provide differential diagnoses and recommendations.

Respond ONLY with valid JSON:
{
  "diagnoses": [{ "condition": "Name", "likelihood": "High/Medium/Low (X%)", "description": "Brief explanation" }],
  "recommendedTests": ["Test 1", "Test 2"],
  "urgencyLevel": "Low/Medium/High/Critical",
  "additionalNotes": "Any additional guidance"
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are an expert veterinary diagnostician. Provide detailed differential diagnoses based on symptoms. Include likelihood percentages, recommended diagnostic tests, and urgency level. Always respond with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    const match = response.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : JSON.parse(response)
  } catch {
    return {
      diagnoses: [{ condition: 'Unable to determine', likelihood: 'N/A', description: 'Please provide more symptoms for analysis' }],
      recommendedTests: ['Complete Blood Count', 'Physical Examination'],
      urgencyLevel: 'Medium',
      additionalNotes: 'Consult a veterinarian for proper diagnosis.',
    }
  }
}

export async function veterinaryTreatment(
  species: string, breed: string, age: string, weight: string, diagnosis: string, currentMedications?: string
): Promise<{
  treatmentPlan: string
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string; notes: string }>
  procedures: string[]
  dietRecommendations: string[]
  followUpSchedule: string
  prognosis: string
}> {
  const prompt = `Patient: ${species}${breed ? `, ${breed}` : ''}, ${age || 'unknown age'}, ${weight ? weight + ' kg' : 'unknown weight'}
Diagnosis: ${diagnosis}
${currentMedications ? `Current Medications: ${currentMedications}` : ''}

Provide a detailed treatment plan.

Respond ONLY with valid JSON:
{
  "treatmentPlan": "Overview of treatment approach",
  "medications": [{ "name": "Med name", "dosage": "Amount", "frequency": "How often", "duration": "How long", "notes": "Special instructions" }],
  "procedures": ["Procedure 1"],
  "dietRecommendations": ["Diet tip 1"],
  "followUpSchedule": "When to follow up",
  "prognosis": "Expected outcome"
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are an expert veterinary treatment specialist. Provide comprehensive treatment plans including medications with dosages, procedures, and follow-up care. Always note weight-based dose adjustments. Respond with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    const match = response.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : JSON.parse(response)
  } catch {
    return {
      treatmentPlan: 'Consult a veterinarian for a proper treatment plan.',
      medications: [],
      procedures: ['Physical examination'],
      dietRecommendations: ['Maintain current diet unless advised otherwise'],
      followUpSchedule: '1-2 weeks',
      prognosis: 'Varies - professional evaluation recommended',
    }
  }
}

export async function symptomChecker(
  species: string, symptoms: string, duration?: string, severity?: string
): Promise<{
  symptomAnalysis: string
  possibleConditions: Array<{ condition: string; likelihood: string; description: string }>
  urgencyAssessment: { level: string; color: string; description: string }
  recommendedActions: string[]
  emergencyIndicators: string[]
}> {
  const prompt = `Species: ${species}
Symptoms: ${symptoms}
Duration: ${duration || 'not specified'}
Severity: ${severity || 'not specified'}

Analyze these symptoms.

Respond ONLY with valid JSON:
{
  "symptomAnalysis": "Overview of the symptom presentation",
  "possibleConditions": [{ "condition": "Name", "likelihood": "High/Medium/Low", "description": "Brief explanation" }],
  "urgencyAssessment": { "level": "Routine/Soon/Urgent/Emergency", "color": "Green/Yellow/Orange/Red", "description": "What this means" },
  "recommendedActions": ["Action 1", "Action 2"],
  "emergencyIndicators": ["Sign that requires immediate vet visit"]
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a veterinary symptom analysis expert. Analyze symptoms and provide possible conditions, urgency assessment with color codes (Green=routine, Yellow=soon, Orange=urgent, Red=emergency), and recommended next steps. Always recommend professional examination. Respond with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    const match = response.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : JSON.parse(response)
  } catch {
    return {
      symptomAnalysis: 'Unable to fully analyze. Please consult a veterinarian.',
      possibleConditions: [],
      urgencyAssessment: { level: 'Soon', color: 'Yellow', description: 'Schedule a veterinary visit soon' },
      recommendedActions: ['Consult a veterinarian'],
      emergencyIndicators: ['Difficulty breathing', 'Severe bleeding', 'Collapse'],
    }
  }
}

export async function drugInteractionChecker(
  species: string, medications: string, weight?: string
): Promise<{
  overallRisk: string
  interactions: Array<{ drug1: string; drug2: string; riskLevel: string; description: string; recommendation: string }>
  dosageConsiderations: string[]
  alternativeMedications: string[]
  monitoringRecommendations: string[]
}> {
  const prompt = `Species: ${species}
Medications: ${medications}
${weight ? `Weight: ${weight} kg` : ''}

Check for drug interactions and provide recommendations.

Respond ONLY with valid JSON:
{
  "overallRisk": "None/Low/Moderate/High/Contraindicated",
  "interactions": [{ "drug1": "Med A", "drug2": "Med B", "riskLevel": "Low/Moderate/High", "description": "What happens", "recommendation": "What to do" }],
  "dosageConsiderations": ["Consideration 1"],
  "alternativeMedications": ["Alternative 1"],
  "monitoringRecommendations": ["Monitor for X"]
}`

  const response = await callOpenRouter([
    { role: 'system', content: 'You are a veterinary pharmacology expert. Analyze drug interactions for veterinary medications. Include species-specific warnings. Respond with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    const match = response.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : JSON.parse(response)
  } catch {
    return {
      overallRisk: 'Unknown',
      interactions: [],
      dosageConsiderations: ['Consult a veterinary pharmacist'],
      alternativeMedications: [],
      monitoringRecommendations: ['Monitor for adverse reactions'],
    }
  }
}

export async function assessCoatCondition(imageBase64: string): Promise<{
  overallCondition: string
  matting: string
  shedding: string
  skinIssues: string[]
  recommendedServices: string[]
  productSuggestions: string[]
  notes: string
}> {
  const prompt = `Look at this dog/cat coat photo and provide a structured grooming-focused assessment.

Respond ONLY with valid JSON:
{
  "overallCondition": "Excellent/Good/Fair/Poor",
  "matting": "None/Light/Moderate/Severe",
  "shedding": "Low/Moderate/High",
  "skinIssues": ["..."],
  "recommendedServices": ["..."],
  "productSuggestions": ["..."],
  "notes": "1-2 sentences"
}`

  try {
    const content = await callOpenRouterVision(imageBase64, prompt)
    return JSON.parse(content)
  } catch {
    return {
      overallCondition: 'Unknown',
      matting: 'Unknown',
      shedding: 'Unknown',
      skinIssues: [],
      recommendedServices: ['Standard groom'],
      productSuggestions: [],
      notes: 'Unable to assess from photo. Please consult a groomer in person.',
    }
  }
}
