import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Custom error class that preserves structured API error data
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorData: any = undefined;
    
    try {
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await res.json();
        // Extract the error message from JSON response
        errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
      } else {
        const text = await res.text();
        if (text) errorMessage = text;
      }
    } catch {
      // Fallback to status text if parsing fails
    }
    
    throw new ApiError(res.status, errorMessage, errorData);
  }
}

// Cache for CSRF token to avoid fetching on every request
let csrfTokenCache: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }
  
  const res = await fetch('/api/auth/csrf-token', {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  
  const data = await res.json();
  csrfTokenCache = data.token;
  return data.token;
}

// Clear CSRF token cache (call on logout)
export function clearCsrfToken() {
  csrfTokenCache = null;
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token for mutating requests
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrfToken = await getCsrfToken();
    headers["x-csrf-token"] = csrfToken;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
