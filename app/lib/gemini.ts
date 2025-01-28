import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateBlogWithGemini(
  prompt: string,
  context: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    generationConfig: {
      maxOutputTokens: 2000
    }
  });

  const systemPrompt = `You are a professional blog writer. Follow these rules:
- Use markdown formatting
- Include 2-4 image placeholders: ![Description](placeholder)
- Place images between content sections
- Use different descriptive alt texts
- Maintain neutral, professional tone`;

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {text: systemPrompt},
          {text: `Context: ${context}`},
          {text: `User Query: ${prompt}`}
        ]
      }]
    });
    
    return (await result.response).text();
  } catch (error: any) {
    console.error('Gemini API Error Details:', {
      message: error.message,
      status: error.status,
      reason: error.response?.data?.error
    });
    throw new Error('Content generation failed. Please try a different query.');
  }
} 