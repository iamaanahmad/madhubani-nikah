'use server';

/**
 * @fileOverview A profile suggestion AI agent.
 *
 * - generateProfileSuggestions - A function that handles the profile suggestion process.
 * - GenerateProfileSuggestionsInput - The input type for the generateProfileSuggestions function.
 * - GenerateProfileSuggestionsOutput - The return type for the generateProfileSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProfileSuggestionsInputSchema = z.object({
  profileDetails: z
    .string()
    .describe('The profile details provided by the user, including education, occupation, religious practice, family background, village, sect, and skills.'),
});
export type GenerateProfileSuggestionsInput = z.infer<typeof GenerateProfileSuggestionsInputSchema>;

const GenerateProfileSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions for improving the profile or highlighting missing information.'),
});
export type GenerateProfileSuggestionsOutput = z.infer<typeof GenerateProfileSuggestionsOutputSchema>;

export async function generateProfileSuggestions(
  input: GenerateProfileSuggestionsInput
): Promise<GenerateProfileSuggestionsOutput> {
  return generateProfileSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProfileSuggestionsPrompt',
  input: {schema: GenerateProfileSuggestionsInputSchema},
  output: {schema: GenerateProfileSuggestionsOutputSchema},
  prompt: `You are an AI assistant helping users create a complete and effective profile on a matrimony app.

  Based on the initial profile details provided, suggest specific improvements or highlight missing information to make the profile more compelling.

  Profile Details: {{{profileDetails}}}
  `,
});

const generateProfileSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateProfileSuggestionsFlow',
    inputSchema: GenerateProfileSuggestionsInputSchema,
    outputSchema: GenerateProfileSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
