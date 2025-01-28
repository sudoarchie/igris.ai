import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateBlogWithGemini(
  prompt: string,
  context: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const systemPrompt = `As a professional blog writer, create a well-structured blog post using this context:
  
  Context: ${context}
  
  Requirements:
  - Include title, introduction, main points, conclusion
  - Use markdown formatting
  - Cite sources where needed
  - Maintain neutral, professional tone`;
  
  try {
    const result = await model.generateContent(`${systemPrompt}\n\nUser Query: ${prompt}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Error:', error);
    throw new Error('Failed to generate content with Gemini');
  }
} 