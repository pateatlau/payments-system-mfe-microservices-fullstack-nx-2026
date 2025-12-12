/**
 * GraphQL Queries
 *
 * POC-3: GraphQL query definitions
 */

import { gql } from '@apollo/client';

/**
 * Get current user query
 */
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      role
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get payment query
 */
export const GET_PAYMENT = gql`
  query GetPayment($id: ID!) {
    payment(id: $id) {
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
 * Get payments query (paginated)
 */
export const GET_PAYMENTS = gql`
  query GetPayments($input: PaginationInput) {
    payments(input: $input) {
      edges {
        node {
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
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

/**
 * Get profile query
 */
export const GET_PROFILE = gql`
  query GetProfile {
    profile {
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
 * Get users query (admin only)
 */
export const GET_USERS = gql`
  query GetUsers($input: PaginationInput) {
    users(input: $input) {
      id
      email
      name
      role
      createdAt
      updatedAt
    }
  }
`;

/**
 * Get user query (admin only)
 */
export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      name
      role
      createdAt
      updatedAt
    }
  }
`;
