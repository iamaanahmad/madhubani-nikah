'use server';

/**
 * @fileOverview Explains why a particular match was suggested to the user.
 *
 * - explainMatch - A function that generates the explanation.
 * - ExplainMatchInput - The input type for the explainMatch function.
 * - ExplainMatchOutput - The return type for the explainMatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainMatchInputSchema = z.object({
  userProfile: z.string().describe('The profile of the current user.'),
  matchProfile: z.string().describe('The profile of the suggested match.'),
});
export type ExplainMatchInput = z.infer<typeof ExplainMatchInputSchema>;

const ExplainMatchOutputSchema = z.object({
  explanation: z.string().describe('The explanation of why the match was suggested.'),
});
export type ExplainMatchOutput = z.infer<typeof ExplainMatchOutputSchema>;

export async function explainMatch(input: ExplainMatchInput): Promise<ExplainMatchOutput> {
  return explainMatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainMatchPrompt',
  input: {schema: ExplainMatchInputSchema},
  output: {schema: ExplainMatchOutputSchema},
  prompt: `You are an expert matchmaker. Explain why the following two profiles are a good match, highlighting shared values, interests, and criteria.

Current User Profile: {{{userProfile}}}
Suggested Match Profile: {{{matchProfile}}}`,
});

const explainMatchFlow = ai.defineFlow(
  {
    name: 'explainMatchFlow',
    inputSchema: ExplainMatchInputSchema,
    outputSchema: ExplainMatchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
