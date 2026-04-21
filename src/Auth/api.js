const API_BASE_URL = "http://localhost:8080";

let csrfTokenPromise = null;

function readCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.split("=").slice(1).join("=")) : "";
}

export async function ensureCsrfToken() {
  const existingToken = readCookie("XSRF-TOKEN");
  if (existingToken) {
    return existingToken;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_BASE_URL}/api/auth/csrf`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("CSRF 토큰을 불러오지 못했습니다.");
        }

        await response.json();

        const cookieToken = readCookie("XSRF-TOKEN");
        if (!cookieToken) {
          throw new Error("CSRF 쿠키를 불러오지 못했습니다.");
        }

        return cookieToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
}

export async function apiFetch(path, options = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers ?? {});

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set("X-XSRF-TOKEN", csrfToken);
    }
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
}

export async function readApiMessage(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  } else {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  }

  return fallbackMessage;
}