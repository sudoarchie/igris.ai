export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BlogPost {
  title: string;
  content: string;
  timestamp: string;
  tags: string[];
} 