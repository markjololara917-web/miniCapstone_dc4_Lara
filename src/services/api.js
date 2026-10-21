const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
const TOKEN_KEY = "classready_api_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to the Laravel API at ${API_BASE}. Make sure "php artisan serve" is running, start the React app with "npm run dev" (not Live Server), and check the CORS settings if the error continues.`,
    );
  }

  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401) clearToken();
    const validation = payload?.errors ? Object.values(payload.errors).flat().join(" ") : "";
    throw new Error(validation || payload?.message || `Request failed (${response.status})`);
  }

  return payload;
}
