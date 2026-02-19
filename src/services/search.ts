import { Item } from '../types';
import { getAllItems, getSetting } from './database';

export interface SearchResult {
  items: Item[];
  explanation?: string;
}

export function normalSearch(query: string, items?: Item[]): Item[] {
  const searchItems = items || getAllItems();
  const lowerQuery = query.toLowerCase();

  return searchItems.filter(item => {
    const searchableText = [
      item.name,
      item.description,
      item.category,
      item.location,
      item.brand,
      item.model,
      item.notes,
      item.tags.join(' '),
    ].join(' ').toLowerCase();

    return searchableText.includes(lowerQuery);
  });
}

export function advancedSearch(filters: {
  query?: string;
  category?: string;
  location?: string;
  condition?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
}, items?: Item[]): Item[] {
  let searchItems = items || getAllItems();

  if (filters.query) {
    searchItems = normalSearch(filters.query, searchItems);
  }

  if (filters.category) {
    searchItems = searchItems.filter(item =>
      item.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  if (filters.location) {
    searchItems = searchItems.filter(item =>
      item.location.toLowerCase().includes(filters.location!.toLowerCase())
    );
  }

  if (filters.condition) {
    searchItems = searchItems.filter(item => item.condition === filters.condition);
  }

  if (filters.tags && filters.tags.length > 0) {
    searchItems = searchItems.filter(item =>
      filters.tags!.some(tag => item.tags.includes(tag))
    );
  }

  if (filters.minPrice !== undefined) {
    searchItems = searchItems.filter(item =>
      item.purchase_price !== null && item.purchase_price >= filters.minPrice!
    );
  }

  if (filters.maxPrice !== undefined) {
    searchItems = searchItems.filter(item =>
      item.purchase_price !== null && item.purchase_price <= filters.maxPrice!
    );
  }

  if (filters.dateFrom) {
    searchItems = searchItems.filter(item =>
      item.purchase_date && item.purchase_date >= filters.dateFrom!
    );
  }

  if (filters.dateTo) {
    searchItems = searchItems.filter(item =>
      item.purchase_date && item.purchase_date <= filters.dateTo!
    );
  }

  return searchItems;
}

type LLMProvider = 'openai' | 'anthropic' | 'ollama';

interface LLMResponse {
  items: Item[];
  explanation?: string;
}

export async function llmSearch(query: string): Promise<LLMResponse> {
  const provider = (getSetting('llmProvider') || 'openai') as LLMProvider;
  const apiKey = getSetting('llmApiKey') || '';

  if (!apiKey) {
    throw new Error('LLM API key not configured. Please set it in Settings.');
  }

  const items = getAllItems();
  const itemsJson = JSON.stringify(items, null, 2);

  let prompt = '';
  let systemPrompt = '';

  switch (provider) {
    case 'openai':
      systemPrompt = 'You are a helpful assistant that searches through an inventory of items. Given a user query and a list of items in JSON format, return the items that match the query. Return your response as a JSON object with the following format: { "items": [...], "explanation": "..." }';
      prompt = `Query: "${query}"\n\nItems:\n${itemsJson}\n\nReturn only items that match the query. If no items match, return an empty array.`;
      break;
    case 'anthropic':
      systemPrompt = 'You are a helpful assistant that searches through an inventory of items. Given a user query and a list of items in JSON format, return the items that match the query. Return your response as a JSON object with the following format: { "items": [...], "explanation": "..." }';
      prompt = `Query: "${query}"\n\nItems:\n${itemsJson}\n\nReturn only items that match the query. If no items match, return an empty array.`;
      break;
    case 'ollama':
      systemPrompt = 'You are a helpful assistant that searches through an inventory of items.';
      prompt = `Given a user query and a list of items in JSON format, return the items that match the query. Return your response as a JSON object with the following format: { "items": [...], "explanation": "..." }\n\nQuery: "${query}"\n\nItems:\n${itemsJson}`;
      break;
  }

  try {
    let response: Response;

    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
          }),
        });
        break;
      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        break;
      case 'ollama':
        response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            stream: false,
          }),
        });
        break;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error: ${error}`);
    }

    const data = await response.json();
    let content: string;

    if (provider === 'anthropic') {
      content = data.content[0].text;
    } else if (provider === 'ollama') {
      content = data.message.content;
    } else {
      content = data.choices[0].message.content;
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from LLM');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and return items
    if (!parsed.items || !Array.isArray(parsed.items)) {
      return { items: [], explanation: parsed.explanation };
    }

    // Filter items that actually exist in our database
    const existingIds = new Set(items.map(i => i.id));
    const validItems = parsed.items.filter((item: Item) => existingIds.has(item.id));

    return {
      items: validItems,
      explanation: parsed.explanation,
    };
  } catch (error) {
    console.error('LLM Search error:', error);
    throw error;
  }
}
