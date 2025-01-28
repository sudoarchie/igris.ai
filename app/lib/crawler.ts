import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse } from 'node-html-parser';

export async function crawlWebsite(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url);
    const root = parse(data);
    
    // Remove unnecessary elements
    root.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());
    
    // Extract main content
    const content = root.querySelector('article') || 
                    root.querySelector('main') || 
                    root.querySelector('body');
    
    return content?.textContent || '';
  } catch (error) {
    console.error(`Failed to crawl ${url}:`, error);
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