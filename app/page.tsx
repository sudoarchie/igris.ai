'use client';

import { useState } from 'react';
import SearchBar from './components/SearchBar';
import { marked } from 'marked';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [blogContent, setBlogContent] = useState('');

  const handleSearch = async (query: string, urls: string[], model: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: query, 
          urls,
          model 
        }),
      });
      
      const data = await response.json();
      setBlogContent(data.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">
          Blog Post Generator
        </h1>
        
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        
        {blogContent && (
          <div className="prose prose-lg max-w-none bg-white p-8 rounded-lg shadow-lg">
            <div 
              dangerouslySetInnerHTML={{ __html: marked(blogContent) }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
