/**
 * Parse une Response fetch en JSON de façon sûre.
 * Évite "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * quand le serveur renvoie un corps vide ou non-JSON (ex: 500, 404 HTML).
 */
export async function safeParseJson<T = Record<string, unknown>>(
  response: Response
): Promise<T> {
  const text = await response.text();
  if (!text || !text.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
