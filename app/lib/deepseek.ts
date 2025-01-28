import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateBlogWithContext(
  prompt: string, 
  context: string,
  model: string
): Promise<string> {
  const systemPrompt = `You are a professional blog writer. Use the context to create a blog post with images:
  
Context:
${context}

Requirements:
- Include 2-4 relevant images using markdown syntax: ![Alt text](image_url)
- Place images between logical content sections
- Use descriptive alt text for images
- Maintain proper image attribution when needed
- Use markdown formatting for the entire post`;

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