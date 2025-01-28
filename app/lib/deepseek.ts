import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateBlogWithContext(
  prompt: string, 
  context: string,
  model: string
): Promise<string> {
  const systemPrompt = `You are a professional blog writer. Use the following context to create a well-structured blog post:
  
  Context:
  ${context}

  Requirements:
  - Include a title, introduction, main points, and conclusion
  - Use markdown formatting
  - Cite sources where appropriate
  - Maintain neutral, professional tone`;

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0].message.content || '';
} 