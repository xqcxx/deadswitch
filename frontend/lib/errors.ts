export type ErrorCode = 
  | 400  // Invalid input
  | 401  // Unauthorized
  | 403  // Forbidden
  | 404  // Not found
  | 409  // Already exists
  | 410  // Already triggered
  | 429  // Rate limit exceeded
  | 500; // Server error

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  400: "Invalid input. Please check your parameters.",
  401: "You are not authorized to perform this action.",
  403: "This action is forbidden at this time.",
  404: "Resource not found. Make sure your switch is registered.",
  409: "Resource already exists.",
  410: "Switch has already been triggered.",
  429: "Rate limit exceeded. Too many attempts.",
  500: "Internal error occurred during distribution."
};

export function getErrorMessage(code: number): string {
  return ERROR_MESSAGES[code as ErrorCode] || `Unknown error (code: ${code})`;
}

export function parseContractError(error: any): { code: number; message: string } {
  // Try to extract error code from Clarity error response
  const errorCode = error?.value?.value || error?.error?.value || 500;
  return {
    code: errorCode,
    message: getErrorMessage(errorCode)
  };
}
