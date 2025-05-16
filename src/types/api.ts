// types/api.ts
export interface ApiSuccessResponse<T> {
  result: T;
  error?: never;
}

export interface ApiErrorResponse {
  result?: never;
  error: {
    code: string;
    message?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
