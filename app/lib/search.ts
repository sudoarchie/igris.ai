import axios from 'axios';
import { HfInference } from '@huggingface/inference';
import { GoogleGenerativeAI } from "@google/generative-ai";

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

export async function searchWeb(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  
  const response = await axios.get(
    'https://www.googleapis.com/customsearch/v1', {
      params: {
        q: query,
        key: apiKey,
        cx: cseId,
        num: 5, // Get top 5 results
        lr: 'lang_en'
      }
    }
  );

  return response.data.items?.map((item: any) => item.link) || [];
}

export async function searchImages(query: string, mainTopic: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  
  if (!apiKey || !cseId) {
    throw new Error('Google Search API credentials not configured');
  }

  const processedQuery = `${mainTopic} ${query} infographic diagram chart illustration`
    .replace(/\b(a|an|the|and|or|of)\b/gi, '') // Remove stop words
    .substring(0, 50);

  const trustedDomains = [
    'wikipedia.org',
    'unsplash.com',
    'pexels.com',
    'flickr.com'
  ];

  const params = {
    q: processedQuery,
    key: apiKey,
    cx: cseId,
    searchType: 'image',
    num: 3,
    rights: 'cc_publicdomain,cc_attribute,cc_sharealike',
    imgType: 'photo',
    safe: 'active',
    imgSize: 'large',
    imgContentType: 'news',
    siteSearch: trustedDomains.join(' '),
    siteSearchFilter: 'i'
  };

  try {
    const response = await axios.get(
      'https://www.googleapis.com/customsearch/v1', {
        params: params
      }
    );

    return response.data.items?.map((item: any) => item.link) || [];
  } catch (error: any) {
    console.error('Google Search API Error:', {
      query: processedQuery,
      status: error.response?.status,
      data: error.response?.data
    });
    return [];
  }
}

function extractImageQueries(content: string, mainTopic: string): string[] {
  // Extract proper nouns and meaningful phrases
  const phrases = content.match(/(?:\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b)/g) || [];
  
  // Filter and prioritize context-specific terms
  const filteredTerms = phrases
    .filter(term => term.split(' ').length < 4) // Max 3-word phrases
    .filter(term => !['The', 'And', 'That', 'This', 'They'].includes(term))
    .map(term => term.replace(/['"()]/g, ''));

  // Combine with TF-IDF style weighting
  const termFrequency = new Map<string, number>();
  filteredTerms.forEach(term => {
    termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
  });

  return Array.from(termFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .slice(0, 3);
}

async function filterRelevantImages(images: string[], query: string): Promise<string[]> {
  // Use AI model to analyze image relevance
  const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  
  return (await Promise.all(images.map(async (url) => {
    try {
      const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
      const imageBase64 = Buffer.from(imageResponse.data).toString('base64');
      
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: `Does this image relate to ${query}? Answer yes/no` },
            { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
          ]
        }]
      });
      
      return result.response.text().toLowerCase().includes('yes') ? url : null;
    } catch {
      return null;
    }
  }))).filter((url): url is string => url !== null);
}

async function clipImageFilter(images: string[], query: string): Promise<string[]> {
  const textEmbedding = await hf.featureExtraction({
    model: 'sentence-transformers/clip-ViT-B-32-multilingual-v1',
    inputs: query
  }) as number[];

  const imageScores = await Promise.all(images.map(async (url) => {
    const imageResponse = await axios.get(url);
    const imageEmbedding = await hf.featureExtraction({
      model: 'clip-ViT-B-32',
      inputs: imageResponse.data
    }) as number[];
    
    return cosineSimilarity(textEmbedding, imageEmbedding);
  }));

  return images.filter((_, i) => imageScores[i] > 0.3);
}

const isValidImageUrl = (url: string) => {
  try {
    new URL(url);
    return /\.(jpeg|jpg|png|webp|gif)$/i.test(url);
  } catch {
    return false;
  }
}; 