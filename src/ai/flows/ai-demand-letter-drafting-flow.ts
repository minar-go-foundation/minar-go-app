'use server';
/**
 * @fileOverview A Genkit flow for drafting demand letter content (subject and body)
 * in both English and Bengali based on user input.
 *
 * - draftDemandLetter - A function that handles the demand letter drafting process.
 * - AIDemandLetterDraftInput - The input type for the draftDemandLetter function.
 * - AIDemandLetterDraftOutput - The return type for the draftDemandLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIDemandLetterDraftInputSchema = z.object({
  purposeDescription: z
    .string()
    .describe(
      'A brief description or keywords outlining the purpose of the demand letter.'
    ),
});
export type AIDemandLetterDraftInput = z.infer<
  typeof AIDemandLetterDraftInputSchema
>;

const AIDemandLetterDraftOutputSchema = z.object({
  subjectEnglish: z
    .string()
    .describe('The drafted subject line for the demand letter in English.'),
  subjectBengali: z
    .string()
    .describe('The drafted subject line for the demand letter in Bengali.'),
  bodyEnglish: z
    .string()
    .describe('The drafted body content for the demand letter in English.'),
  bodyBengali: z
    .string()
    .describe('The drafted body content for the demand letter in Bengali.'),
});
export type AIDemandLetterDraftOutput = z.infer<
  typeof AIDemandLetterDraftOutputSchema
>;

export async function draftDemandLetter(
  input: AIDemandLetterDraftInput
): Promise<AIDemandLetterDraftOutput> {
  return aiDemandLetterDraftFlow(input);
}

const demandLetterDraftPrompt = ai.definePrompt({
  name: 'demandLetterDraftPrompt',
  input: {schema: AIDemandLetterDraftInputSchema},
  output: {schema: AIDemandLetterDraftOutputSchema},
  prompt: `You are an AI assistant specialized in drafting professional demand letters.

Your task is to generate a subject line and body content for a demand letter, based on the user's provided purpose description. You must provide the output in both English and Bengali. Ensure the Bengali text uses the Noto Sans Bengali font characters.

Purpose Description: {{{purposeDescription}}}

Generate the content, ensuring it is professional and suitable for an official demand letter.`,
});

const aiDemandLetterDraftFlow = ai.defineFlow(
  {
    name: 'aiDemandLetterDraftFlow',
    inputSchema: AIDemandLetterDraftInputSchema,
    outputSchema: AIDemandLetterDraftOutputSchema,
  },
  async (input) => {
    const {output} = await demandLetterDraftPrompt(input);
    return output!;
  }
);
