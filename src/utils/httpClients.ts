interface ApiResponseSuccess<T> {
  data: T
  status: number
}

interface ApiResponseError {
  error: string
  status: number
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError

interface HttpRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  headers?: Record<string, string>
  body?: BodyInit | object
  queryParams?: Record<string, string | number>
  timeout?: number // 可配置超时
}

const defaultHeaders = {
  "Content-Type": "application/json",
}

// 类型守卫函数
function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponseSuccess<T> {
  return "data" in response
}

// 默认超时 30秒
const DEFAULT_TIMEOUT = 30000

function buildUrl(url: string, queryParams?: Record<string, string | number>) {
  try {
    const urlObj = new URL(url)
    if (queryParams) {
      Object.entries(queryParams)
        .filter(([, value]) => value !== null && value !== undefined)
        .forEach(([key, value]) => urlObj.searchParams.append(key, String(value)))
    }
    return urlObj.toString()
  } catch {
    const queryString = queryParams
      ? `?${new URLSearchParams(Object.entries(queryParams).map(([k, v]) => [k, String(v)]))}`
      : ""
    return url + queryString
  }
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

// 统一返回值处理
function extractData(responseData: any): any {
  // 根据不同的返回结构提取数据
  if ("data" in responseData) {
    return responseData.data
  }
  if ("result" in responseData) {
    return responseData.result
  }
  if (responseData) {
    // 如果返回的数据结构不确定，则默认返回第一个字段
    const key = Object.keys(responseData)[0]
    return responseData[key]
  }
  return null
}

// 延时函数
export function httpDelayRequest(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 请求失败时，尝试重新发送请求，默认 5 次, 间隔 1s
export async function retryRequest<T>(
  fn: () => Promise<T>,
  methodName: string = "UnknownMethod",
  retries: number = 5,
  delayMs: number = 1000,
): Promise<T> {
  let attempt = 0

  while (attempt <= retries) {
    try {
      return await fn()
    } catch (error) {
      if (attempt < retries) {
        console.warn(`[${methodName}] Request failed (attempt ${attempt + 1}), retrying...`)
        await httpDelayRequest(delayMs)
        attempt++
      } else {
        console.error(`[${methodName}] Request failed after ${retries} retries:`, error)
        throw error
      }
    }
  }

  throw new Error(`[${methodName}] Unreachable code reached`) // 理论上不会到这里
}

export const httpClients = {
  async request<T>(url: string, options: HttpRequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = "GET", headers = {}, body, queryParams, timeout = DEFAULT_TIMEOUT } = options
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const finalUrl = buildUrl(url, queryParams)
      const response = await fetch(finalUrl, {
        method,
        headers: { ...defaultHeaders, ...headers },
        body: body instanceof FormData ? body : JSON.stringify(body),
        signal: controller.signal,
      })

      const responseData = await parseJsonResponse(response)
      clearTimeout(timeoutId) // 清除超时计时器

      if (responseData.status === 401) {
        window.location.href = "/login"
        return {
          status: response.status,
          error: "",
        }
      }

      // 如果 HTTP 请求本身失败（非 2xx 状态码），处理这种错误
      if (!response.ok) {
        const errorMessage = responseData?.error || response.statusText || "Unknown error"
        return {
          status: response.status,
          error: errorMessage,
        }
      }

      // 如果 API 返回了业务错误（比如 `error` 字段），也要处理
      if (responseData?.error) {
        return {
          status: response.status,
          error: responseData.error || "Unknown error occurred",
        }
      }

      // 提取成功数据
      const data = extractData(responseData)
      if (!data) {
        return {
          status: responseData?.status || response.status,
          error: "Response result field is missing or invalid.",
        }
      }

      return {
        data,
        status: response.status,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          status: 408,
          error: "Request timed out. Please try again later.",
        }
      }

      // 捕获其他错误
      return {
        status: 500,
        error: error instanceof Error ? error.message : "Network request failed",
      }
    } finally {
      clearTimeout(timeoutId)
    }
  },

  get<T>(url: string, queryParams?: Record<string, string | number>) {
    return this.request<T>(url, { method: "GET", queryParams })
  },

  post<T>(url: string, body: object) {
    return this.request<T>(url, { method: "POST", body })
  },

  put<T>(url: string, body: object) {
    return this.request<T>(url, { method: "PUT", body })
  },

  delete<T>(url: string) {
    return this.request<T>(url, { method: "DELETE" })
  },

  isSuccessResponse,
}
