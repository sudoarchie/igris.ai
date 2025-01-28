import { generateBlogWithContext } from '@/app/lib/deepseek';
import { generateBlogWithGemini } from '@/app/lib/gemini';
import { processUrls } from '@/app/lib/crawler';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, urls, model } = await req.json();
    
    const context = await processUrls(urls);
    let blogContent;
    
    if (model.startsWith('gpt')) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }
      blogContent = await generateBlogWithContext(prompt, context, model);
    } else if (model === 'gemini-pro') {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('Google API key not configured');
      }
      blogContent = await generateBlogWithGemini(prompt, context);
    }
    
    return NextResponse.json({ content: blogContent });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to generate blog post',
        details: error?.response?.data || {} 
      },
      { status: error?.status || 500 }
    );
  }
} 