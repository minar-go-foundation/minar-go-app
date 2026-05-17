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
  prompt: `You are an AI assistant specialized in drafting professional official demand letters.

Your task is to generate a subject line and body content for an official letter, based on the user's provided purpose description. 

IMPORTANT STRUCTURE:
The body content should be structured with clear numbered points (1, 2, 3...) as seen in professional documents. 
For example:
1. Application for membership/account opening...
2. Terms regarding installment or deposit timelines...
3. Financial management and authority delegation...

Ensure the tone is very formal and professional.
You must provide the output in both English and Bengali.

Purpose Description: {{{purposeDescription}}}

Generate the content now.`,
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
