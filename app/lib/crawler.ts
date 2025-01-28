import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse } from 'node-html-parser';

export async function crawlWebsite(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);
    
    // Improved content extraction
    $('script, style, nav, footer, header, iframe').remove();
    
    // Try to find main content sections
    const content = 
      $('article').text() || 
      $('main').text() ||
      $('body').text();
    
    return content.substring(0, 2000); // Limit per page
  } catch (error) {
    return '';
  }
}

export async function processUrls(urls: string[]): Promise<string> {
  const contents = await Promise.all(
    urls.map(url => crawlWebsite(url))
  );
  
  return contents
    .filter(text => text.length > 0)
    .join('\n\n')
    .substring(0, 5000); // Limit context length
} 