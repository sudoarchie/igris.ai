import { generateBlogWithContext } from '@/app/lib/deepseek';
import { generateBlogWithGemini } from '@/app/lib/gemini';
import { processUrls } from '@/app/lib/crawler';
import { searchWeb, searchImages } from '@/app/lib/search';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();
    
    // Add validation for required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing prompt' },
        { status: 400 }
      );
    }

    // Automatically search for relevant URLs
    const searchResults: string[] = await searchWeb(prompt);
    const context = await processUrls(searchResults);
    
    // Handle empty context case
    if (!context) {
      return NextResponse.json(
        { error: 'No relevant content found' },
        { status: 404 }
      );
    }

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
    
    // Add null check for blogContent before using it
    if (!blogContent) {
      throw new Error('Failed to generate blog content');
    }

    // Now TypeScript knows blogContent is string
    const imageQueries = extractImageQueries(blogContent!);
    
    // Explicitly type the images array
    const images: string[][] = await Promise.all(
      imageQueries.map(query => searchImages(query))
    );

    // Add type assertion for flat array
    const flatImages: string[] = images.flat() as string[];
    blogContent = replaceImagePlaceholders(blogContent!, flatImages);
    
    return NextResponse.json({ content: blogContent });
  } catch (error: any) {
    // Add proper error logging
    console.error('API Error:', error);
    const status = error.status || 500;
    const errorMessage = error.message || 'Internal server error';
    const errorDetails = error.details || {};

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails 
      },
      { status }
    );
  }
}

function extractImageQueries(content: string): string[] {
  // Extract key terms for image search with proper type assertion
  const terms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  return Array.from(new Set(terms as RegExpMatchArray)).slice(0, 3);
}

function replaceImagePlaceholders(content: string, images: string[]): string {
  let imageIndex = 0;
  return content.replace(/!\[(.*?)\]\(placeholder\)/g, (match: string, p1: string) => {
    const imageUrl = images[imageIndex] || 'https://via.placeholder.com/800x400';
    imageIndex++;
    return `![${p1}](${imageUrl})`;
  });
} 