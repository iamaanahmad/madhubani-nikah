'use server';

/**
 * @fileOverview AI-powered compatibility scoring system for matrimony matching
 *
 * - calculateCompatibility - Main function for calculating compatibility between two profiles
 * - CompatibilityInput - Input type for compatibility calculation
 * - CompatibilityOutput - Output type with detailed compatibility analysis
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { AIMatchingInput, AIMatchingOutput } from '@/lib/types/compatibility.types';

const CompatibilityInputSchema = z.object({
  userProfile: z.string().describe('JSON string of the user profile seeking matches'),
  candidateProfile: z.string().describe('JSON string of the candidate profile to evaluate'),
  userPreferences: z.string().optional().describe('JSON string of user preferences and criteria'),
  culturalContext: z.enum(['madhubani', 'bihar', 'general']).describe('Cultural context for matching'),
});

export type CompatibilityInput = z.infer<typeof CompatibilityInputSchema>;

const CompatibilityOutputSchema = z.object({
  compatibilityScore: z.number().min(0).max(100).describe('Overall compatibility score from 0-100'),
  explanation: z.string().describe('Detailed explanation of the compatibility analysis'),
  matchReasons: z.array(z.string()).describe('List of positive matching factors'),
  potentialConcerns: z.array(z.string()).describe('List of potential compatibility concerns'),
  recommendationLevel: z.enum(['highly_recommended', 'recommended', 'consider', 'not_recommended'])
    .describe('Overall recommendation level'),
  locationScore: z.number().min(0).max(100).describe('Location compatibility score'),
  educationScore: z.number().min(0).max(100).describe('Education compatibility score'),
  religiousScore: z.number().min(0).max(100).describe('Religious compatibility score'),
  familyScore: z.number().min(0).max(100).describe('Family background compatibility score'),
  lifestyleScore: z.number().min(0).max(100).describe('Lifestyle and occupation compatibility score'),
  personalityScore: z.number().min(0).max(100).describe('Personality and communication compatibility score'),
});

export type CompatibilityOutput = z.infer<typeof CompatibilityOutputSchema>;

export async function calculateCompatibility(input: CompatibilityInput): Promise<CompatibilityOutput> {
  return compatibilityFlow(input);
}

const compatibilityPrompt = ai.definePrompt({
  name: 'compatibilityPrompt',
  input: { schema: CompatibilityInputSchema },
  output: { schema: CompatibilityOutputSchema },
  prompt: `You are an expert matrimony matchmaker specializing in Islamic matrimony in the Madhubani district of Bihar, India. 

Analyze the compatibility between these two profiles and provide a comprehensive compatibility assessment.

User Profile (seeking matches): {{{userProfile}}}
Candidate Profile (to evaluate): {{{candidateProfile}}}
User Preferences: {{{userPreferences}}}
Cultural Context: {{{culturalContext}}}

Consider these factors in your analysis:

1. LOCATION COMPATIBILITY (Weight: High for Madhubani context)
   - Same village/block/district preference
   - Travel distance and family proximity
   - Cultural familiarity within Madhubani region

2. EDUCATION COMPATIBILITY (Weight: High)
   - Educational level matching or complementarity
   - Career aspirations alignment
   - Intellectual compatibility

3. RELIGIOUS COMPATIBILITY (Weight: Very High for Islamic matrimony)
   - Sect matching (Sunni/Shia/Other)
   - Religious practice level alignment
   - Family religious background

4. FAMILY COMPATIBILITY (Weight: High in Indian context)
   - Family background and social status
   - Family type (nuclear/joint) preferences
   - Biradari/community matching if applicable

5. LIFESTYLE COMPATIBILITY (Weight: Medium)
   - Occupation compatibility
   - Skills and interests overlap
   - Life goals alignment

6. PERSONALITY COMPATIBILITY (Weight: Medium)
   - Communication style from bio analysis
   - Values and personality traits
   - Emotional compatibility indicators

Provide specific scores (0-100) for each category and an overall compatibility score.
Give practical, culturally-sensitive explanations that would help users understand the match quality.
Consider Madhubani's cultural context, Islamic matrimony principles, and modern compatibility factors.

Be honest about potential concerns while highlighting positive aspects.
Provide actionable insights that could help improve compatibility or address concerns.`,
});

const compatibilityFlow = ai.defineFlow(
  {
    name: 'compatibilityFlow',
    inputSchema: CompatibilityInputSchema,
    outputSchema: CompatibilityOutputSchema,
  },
  async (input) => {
    const { output } = await compatibilityPrompt(input);
    return output!;
  }
);