import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, urls: string[], model: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [urls, setUrls] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = urls.split('\n').filter(url => url.trim() !== '');
    onSearch(query, urlList, selectedModel);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-4">
      <div className="flex gap-4 items-center">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="p-2 border rounded-md bg-white"
        >
          <option value="gpt-3.5-turbo">GPT-3.5</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gemini-pro">Gemini</option>
        </select>
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500"
            placeholder="Enter your blog topic..."
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Research URLs (one per line)</label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="w-full p-2 border rounded-md h-32"
          placeholder="https://example.com/article1\nhttps://example.com/research2"
        />
      </div>
      
      <div className="relative">
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Blog'}
        </button>
      </div>
    </form>
  );
} 