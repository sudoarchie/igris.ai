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
    const mainTopic = blogContent.split('.')[0].replace(/[^a-zA-Z ]/g, '') || prompt;

    const imageQueries = extractImageQueries(blogContent, mainTopic);
    
    // Search images using combined queries
    const images = (await Promise.all(
      imageQueries.map(query => 
        searchImages(query, mainTopic)
          .then(results => results.filter(url => 
            url.match(/\.(jpeg|jpg|png|webp)$/i) && 
            !url.toLowerCase().includes('logo')
          ))
      )
    )).flat().filter(url => url);

    blogContent = await replaceImagePlaceholders(blogContent, images, mainTopic);
    
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

function extractImageQueries(content: string, mainTopic: string): string[] {
  // Extract meaningful nouns and phrases
  const phrases = content.match(/(?:\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b)|(?:\b\w{4,}s?\b)/gi) || [];
  
  // Filter and prioritize relevant terms
  const filteredTerms = phrases
    .filter(term => term.length > 3)
    .filter(term => !['The', 'And', 'That', 'This'].includes(term))
    .map(term => term.toLowerCase());

  // Combine with main topic and deduplicate
  const uniqueTerms = Array.from(new Set([
    mainTopic,
    ...filteredTerms
  ]));

  return uniqueTerms.slice(0, 2); // More focused queries
}

async function replaceImagePlaceholders(content: string, images: string[], mainTopic: string): Promise<string> {
  const placeholderMatches = Array.from(content.matchAll(/!\[(.*?)\]\(placeholder\)/g));
  let imageIndex = 0;

  const replacements = await Promise.all(
    placeholderMatches.map(async (match) => {
      const altText = match[1];
      const query = imageIndex < images.length ? '' : mainTopic;
      
      // Get image URL with proper async handling
      const imageUrl = images[imageIndex] || 
        (await searchImages(query, mainTopic).then(res => res[0])) || 
        'https://via.placeholder.com/800x400';
      
      console.log('Image replacement:', {
        existingImages: images.length,
        newSearchQuery: query,
        resultUrl: imageUrl
      });
      
      imageIndex++;
      return {
        match: match[0],
        replacement: `![${altText || mainTopic}](${imageUrl})`
      };
    })
  );

  // Apply all replacements sequentially
  let result = content;
  for (const { match, replacement } of replacements) {
    result = result.replace(match, replacement);
  }
  
  return result;
} 