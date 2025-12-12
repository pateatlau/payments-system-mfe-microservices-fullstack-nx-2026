/**
 * GraphQL Schema Definitions
 *
 * POC-3: GraphQL API alongside REST API
 * Provides flexible querying and reduced over-fetching
 */

import { gql } from 'graphql-tag';

/**
 * GraphQL Type Definitions
 */
export const typeDefs = gql`
  # Scalars
  scalar DateTime
  scalar JSON

  # Enums
  enum UserRole {
    ADMIN
    CUSTOMER
    VENDOR
  }

  enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  enum PaymentType {
    PAYMENT
    INITIATE
  }

  # User Types
  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthResponse {
    user: User!
    accessToken: String!
    refreshToken: String!
    expiresIn: String!
  }

  # Payment Types
  type Payment {
    id: ID!
    userId: ID!
    amount: Float!
    currency: String!
    status: PaymentStatus!
    type: PaymentType!
    description: String
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PaymentConnection {
    edges: [PaymentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PaymentEdge {
    node: Payment!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Profile Types
  type Profile {
    id: ID!
    userId: ID!
    firstName: String
    lastName: String
    phone: String
    address: String
    city: String
    country: String
    avatar: String
    preferences: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Admin Types
  type AuditLog {
    id: ID!
    userId: ID
    action: String!
    resourceType: String
    resourceId: ID
    details: JSON
    ipAddress: String
    userAgent: String
    createdAt: DateTime!
  }

  type SystemConfig {
    key: String!
    value: JSON!
    description: String
    updatedAt: DateTime!
  }

  # Input Types
  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
  }

  input CreatePaymentInput {
    amount: Float!
    currency: String!
    type: PaymentType!
    description: String
    metadata: JSON
  }

  input UpdatePaymentInput {
    status: PaymentStatus
    description: String
    metadata: JSON
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    phone: String
    address: String
    city: String
    country: String
    avatar: String
    preferences: JSON
  }

  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  # Query Types
  type Query {
    # Auth Queries
    me: User! @auth

    # Payment Queries
    payment(id: ID!): Payment @auth
    payments(input: PaginationInput): PaymentConnection! @auth

    # Profile Queries
    profile: Profile @auth

    # Admin Queries (ADMIN only)
    users(input: PaginationInput): [User!]! @auth @admin
    user(id: ID!): User @auth @admin
    auditLogs(input: PaginationInput): [AuditLog!]! @auth @admin
    systemConfig(key: String!): SystemConfig @auth @admin
  }

  # Mutation Types
  type Mutation {
    # Auth Mutations
    login(input: LoginInput!): AuthResponse!
    register(input: RegisterInput!): AuthResponse!
    logout: Boolean! @auth
    refreshToken(refreshToken: String!): AuthResponse!

    # Payment Mutations
    createPayment(input: CreatePaymentInput!): Payment! @auth
    updatePayment(id: ID!, input: UpdatePaymentInput!): Payment! @auth
    deletePayment(id: ID!): Boolean! @auth

    # Profile Mutations
    updateProfile(input: UpdateProfileInput!): Profile! @auth

    # Admin Mutations (ADMIN only)
    updateUserRole(id: ID!, role: UserRole!): User! @auth @admin
    updateSystemConfig(key: String!, value: JSON!): SystemConfig! @auth @admin
  }

  # Subscription Types (for future real-time updates)
  type Subscription {
    paymentUpdated(userId: ID!): Payment! @auth
    userUpdated: User! @auth @admin
  }
`;
