import axios from 'axios';

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

export async function searchImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  
  const response = await axios.get(
    'https://www.googleapis.com/customsearch/v1', {
      params: {
        q: query,
        key: apiKey,
        cx: cseId,
        searchType: 'image',
        num: 3, // Get 3 images per search
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike',
        imgType: 'photo',
        safe: 'active'
      }
    }
  );

  return response.data.items?.map((item: any) => item.link) || [];
} 