import { ApiResponse, httpClients } from "@/utils/httpClients";

// 通用 fetcher
export async function dataFetcher<T>(url: string): Promise<T> {
  const response: ApiResponse<T> = await httpClients.get<T>(url);
  if (!httpClients.isSuccessResponse(response)) {
    throw new Error(response.error || "Unknown error");
  }
  return response.data;
}