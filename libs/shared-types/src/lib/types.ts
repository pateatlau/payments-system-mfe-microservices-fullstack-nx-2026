/**
 * User interface representing a user in the system
 */
export interface User {
  /**
   * Unique identifier for the user
   */
  id: string;
  /**
   * User's full name
   */
  name: string;
  /**
   * User's email address
   */
  email: string;
  /**
   * Optional user role
   */
  role?: string;
}

/**
 * API Response wrapper interface
 */
export interface ApiResponse<T> {
  /**
   * Response data
   */
  data: T;
  /**
   * Response status code
   */
  status: number;
  /**
   * Optional error message
   */
  message?: string;
  /**
   * Whether the request was successful
   */
  success: boolean;
}
