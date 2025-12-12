/**
 * GraphQL Mutations
 *
 * POC-3: GraphQL mutation definitions
 */

import { gql } from '@apollo/client';

/**
 * Login mutation
 */
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        name
        role
      }
      accessToken
      refreshToken
      expiresIn
    }
  }
`;

/**
 * Register mutation
 */
export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        name
        role
      }
      accessToken
      refreshToken
      expiresIn
    }
  }
`;

/**
 * Logout mutation
 */
export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

/**
 * Refresh token mutation
 */
export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      user {
        id
        email
        name
        role
      }
      accessToken
      refreshToken
      expiresIn
    }
  }
`;

/**
 * Create payment mutation
 */
export const CREATE_PAYMENT = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      id
      userId
      amount
      currency
      status
      type
      description
      metadata
      createdAt
      updatedAt
    }
  }
`;

/**
 * Update payment mutation
 */
export const UPDATE_PAYMENT = gql`
  mutation UpdatePayment($id: ID!, $input: UpdatePaymentInput!) {
    updatePayment(id: $id, input: $input) {
      id
      userId
      amount
      currency
      status
      type
      description
      metadata
      createdAt
      updatedAt
    }
  }
`;

/**
 * Delete payment mutation
 */
export const DELETE_PAYMENT = gql`
  mutation DeletePayment($id: ID!) {
    deletePayment(id: $id)
  }
`;

/**
 * Update profile mutation
 */
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      userId
      firstName
      lastName
      phone
      address
      city
      country
      avatar
      preferences
      createdAt
      updatedAt
    }
  }
`;

/**
 * Update user role mutation (admin only)
 */
export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: ID!, $role: UserRole!) {
    updateUserRole(id: $id, role: $role) {
      id
      email
      name
      role
      createdAt
      updatedAt
    }
  }
`;
