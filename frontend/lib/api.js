import { getApiBase } from '@/lib/backend-url';

async function fetchJson(path) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${getApiBase()}${path}`, {
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getCategories(lang = 'ar') {
  return fetchJson(`/categories/?lang=${lang}`);
}

export async function getItems(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchJson(`/items/${query ? `?${query}` : ''}`);
}

export async function getItemById(id, lang = 'ar') {
  return fetchJson(`/items/${id}/?lang=${lang}`);
}
