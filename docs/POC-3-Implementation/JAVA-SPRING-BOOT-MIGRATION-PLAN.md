# Java Spring Boot Migration Plan

**Document Version:** 1.0  
**Date:** December 12, 2025  
**Status:** Planning Complete  
**Purpose:** Detailed, actionable migration plan for migrating backend from Node.js/Express/TypeScript to Java Spring Boot

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Migration Phases](#3-migration-phases)
4. [Phase 1: Planning & Infrastructure Setup](#phase-1-planning--infrastructure-setup)
5. [Phase 2: Profile Service Migration (POC)](#phase-2-profile-service-migration-poc)
6. [Phase 3: Auth Service Migration](#phase-3-auth-service-migration)
7. [Phase 4: Payments Service Migration](#phase-4-payments-service-migration)
8. [Phase 5: Admin Service Migration](#phase-5-admin-service-migration)
9. [Phase 6: API Gateway Migration](#phase-6-api-gateway-migration)
10. [Phase 7: Testing & Validation](#phase-7-testing--validation)
11. [Phase 8: Deployment & Rollout](#phase-8-deployment--rollout)
12. [Risk Mitigation](#risk-mitigation)
13. [Success Criteria](#success-criteria)

---

## 1. Overview

### 1.1 Migration Scope

**Services to Migrate:**

1. Profile Service (Port 3004) - **POC Service**
2. Auth Service (Port 3001)
3. Payments Service (Port 3002)
4. Admin Service (Port 3003)
5. API Gateway (Port 3000) - **Most Complex**

**Estimated Timeline:** 4-6 months  
**Team Size:** 3-5 Java developers  
**Code Reusability:** 0% (complete rewrite required)

### 1.2 Migration Strategy

**Approach:** Incremental migration with parallel run period

- Start with simplest service (Profile) as POC
- Migrate services in order of complexity
- Maintain API contracts (no breaking changes)
- Run both systems in parallel during transition
- Gradual cutover with rollback capability

**Key Principles:**

- ✅ Review and testing after every task/subtask
- ✅ No proceeding to next step without verification
- ✅ Maintain backward compatibility
- ✅ Document all decisions and changes
- ✅ Continuous integration and deployment

---

## 2. Prerequisites

### 2.1 Technical Prerequisites

**Required Tools:**

- Java Development Kit (JDK) 17 or higher
- Maven 3.8+ or Gradle 7.5+
- IntelliJ IDEA (recommended) or Eclipse
- Docker and Docker Compose
- PostgreSQL 16.x (existing)
- RabbitMQ 3.x (existing)
- Redis 7.x (existing)
- Git

**Required Knowledge:**

- Java 17+ (records, pattern matching, sealed classes)
- Spring Boot 3.x
- Spring Data JPA
- Spring Security
- Spring AMQP (RabbitMQ)
- Spring WebSocket
- Spring GraphQL (optional)
- Maven/Gradle build tools
- JUnit 5 and Mockito

### 2.2 Team Prerequisites

**Required Team Members:**

- 1-2 Senior Java developers (Spring Boot expertise)
- 1-2 Mid-level Java developers
- 1 DevOps engineer (for infrastructure)
- 1 QA engineer (for testing)

**Training Requirements:**

- Spring Boot fundamentals (if team lacks experience)
- Spring Cloud Gateway (for API Gateway)
- Reactive programming (WebFlux) - for streaming proxy
- Spring Security JWT implementation

### 2.3 Documentation Prerequisites

**Required Documentation:**

- Current API contracts (OpenAPI/Swagger specs)
- Database schemas (Prisma schemas)
- RabbitMQ event contracts
- Authentication/authorization flow documentation
- Current deployment architecture
- Environment configuration documentation

---

## 3. Migration Phases

### Phase Overview

| Phase       | Service               | Duration  | Complexity  | Dependencies   |
| ----------- | --------------------- | --------- | ----------- | -------------- |
| **Phase 1** | Infrastructure Setup  | 2-3 weeks | Medium      | None           |
| **Phase 2** | Profile Service (POC) | 2-3 weeks | Low         | Phase 1        |
| **Phase 3** | Auth Service          | 3-4 weeks | Medium      | Phase 2        |
| **Phase 4** | Payments Service      | 3-4 weeks | Medium-High | Phase 3        |
| **Phase 5** | Admin Service         | 2-3 weeks | Low-Medium  | Phase 3        |
| **Phase 6** | API Gateway           | 4-6 weeks | Very High   | Phases 3, 4, 5 |
| **Phase 7** | Testing & Validation  | 3-4 weeks | Medium      | All phases     |
| **Phase 8** | Deployment & Rollout  | 1-2 weeks | Medium      | Phase 7        |

**Total Estimated Duration:** 4-6 months

---

## Phase 1: Planning & Infrastructure Setup

**Duration:** 2-3 weeks  
**Complexity:** Medium  
**Dependencies:** None

### Task 1.1: Project Structure Setup

**Objective:** Create Spring Boot project structure for all services

**Subtasks:**

1. **1.1.1: Create Parent POM/Multi-Module Project**
   - Set up Maven parent POM or Gradle multi-project structure
   - Define common dependencies and versions
   - Configure build plugins (Spring Boot, compiler, etc.)
   - Set up shared modules (common, events, observability)
   - **Review Checkpoint:** Verify project structure, build configuration
   - **Testing:** Run `mvn clean install` or `gradle build` - should succeed
   - **Verification:** All modules compile, no dependency conflicts

2. **1.1.2: Create Service Modules**
   - Create `api-gateway` module
   - Create `auth-service` module
   - Create `payments-service` module
   - Create `admin-service` module
   - Create `profile-service` module
   - Configure each module with Spring Boot starter
   - **Review Checkpoint:** Verify all modules created, basic structure correct
   - **Testing:** Each module should build independently
   - **Verification:** All services have correct Spring Boot structure

3. **1.1.3: Configure Build Tools**
   - Set up Maven/Gradle wrapper
   - Configure Java version (17+)
   - Configure Spring Boot version (3.x)
   - Set up code formatting (Google Java Format or similar)
   - Configure static analysis (Checkstyle, PMD, SpotBugs)
   - **Review Checkpoint:** Review build configuration, coding standards
   - **Testing:** Run build, verify formatting, run static analysis
   - **Verification:** Build succeeds, no code quality issues

### Task 1.2: Database Schema Migration

**Objective:** Convert Prisma schemas to JPA entities

**Subtasks:**

1. **1.2.1: Analyze Prisma Schemas**
   - Review all Prisma schema files
   - Document entity relationships
   - Document constraints and indexes
   - Document enums and custom types
   - **Review Checkpoint:** Review schema analysis document
   - **Testing:** N/A (analysis only)
   - **Verification:** All schemas documented, relationships understood

2. **1.2.2: Create JPA Entities for Profile Service**
   - Create `User` entity (from Profile schema)
   - Create `UserProfile` entity
   - Create `UserPreferences` entity
   - Map Prisma types to JPA types
   - Configure relationships (@OneToOne, @ManyToOne, etc.)
   - Add validation annotations
   - **Review Checkpoint:** Review entity design, relationships, validation
   - **Testing:** Create unit tests for entity creation, validation
   - **Verification:** Entities match Prisma schema, validation works

3. **1.2.3: Create JPA Entities for Auth Service**
   - Create `User` entity
   - Create `Device` entity
   - Create `RefreshToken` entity
   - Map relationships and constraints
   - **Review Checkpoint:** Review entity design
   - **Testing:** Unit tests for entities
   - **Verification:** Entities correct, relationships work

4. **1.2.4: Create JPA Entities for Payments Service**
   - Create `Payment` entity
   - Create `Transaction` entity
   - Create denormalized `User` entity (zero-coupling pattern)
   - Map relationships
   - **Review Checkpoint:** Review entity design, zero-coupling pattern
   - **Testing:** Unit tests for entities
   - **Verification:** Entities correct, zero-coupling maintained

5. **1.2.5: Create JPA Entities for Admin Service**
   - Create `AuditLog` entity
   - Create `SystemHealth` entity (if needed)
   - Map relationships
   - **Review Checkpoint:** Review entity design
   - **Testing:** Unit tests for entities
   - **Verification:** Entities correct

6. **1.2.6: Create Database Migration Scripts**
   - Use Flyway or Liquibase for migrations
   - Create initial migration scripts for each service
   - Test migrations on clean database
   - **Review Checkpoint:** Review migration scripts
   - **Testing:** Run migrations, verify schema matches Prisma
   - **Verification:** All migrations succeed, schema correct

### Task 1.3: Infrastructure Configuration

**Objective:** Set up Docker, databases, message broker, cache

**Subtasks:**

1. **1.3.1: Update Docker Compose**
   - Add Spring Boot service containers
   - Configure PostgreSQL databases (4 separate DBs)
   - Configure RabbitMQ (existing)
   - Configure Redis (existing)
   - Set up service networking
   - Configure environment variables
   - **Review Checkpoint:** Review Docker Compose configuration
   - **Testing:** Run `docker-compose up`, verify all services start
   - **Verification:** All services healthy, databases accessible

2. **1.3.2: Configure Database Connections**
   - Configure Spring Data JPA for each service
   - Set up connection pooling (HikariCP)
   - Configure transaction management
   - Set up database health checks
   - **Review Checkpoint:** Review database configuration
   - **Testing:** Test database connections from each service
   - **Verification:** All services can connect to their databases

3. **1.3.3: Configure RabbitMQ**
   - Set up Spring AMQP configuration
   - Configure exchanges and queues
   - Set up connection factory
   - Configure message serialization (JSON)
   - **Review Checkpoint:** Review RabbitMQ configuration
   - **Testing:** Test RabbitMQ connectivity, send/receive test messages
   - **Verification:** RabbitMQ connections work, messages flow

4. **1.3.4: Configure Redis**
   - Set up Spring Data Redis configuration
   - Configure connection pool
   - Set up Redis health checks
   - **Review Checkpoint:** Review Redis configuration
   - **Testing:** Test Redis connectivity, test cache operations
   - **Verification:** Redis connections work, caching functional

### Task 1.4: Shared Libraries Setup

**Objective:** Create shared modules for common functionality

**Subtasks:**

1. **1.4.1: Create Common Module**
   - Create shared DTOs
   - Create shared exceptions
   - Create shared utilities
   - Create shared constants
   - **Review Checkpoint:** Review common module structure
   - **Testing:** Unit tests for utilities
   - **Verification:** Common module compiles, tests pass

2. **1.4.2: Create Events Module**
   - Create event DTOs (matching RabbitMQ contracts)
   - Create event publisher interface
   - Create event subscriber interface
   - Create event type enums
   - **Review Checkpoint:** Review event contracts, match with existing
   - **Testing:** Unit tests for event serialization/deserialization
   - **Verification:** Event contracts match existing RabbitMQ messages

3. **1.4.3: Create Observability Module**
   - Set up Micrometer for Prometheus
   - Set up OpenTelemetry for tracing
   - Set up Sentry integration
   - Create logging configuration (Logback)
   - **Review Checkpoint:** Review observability configuration
   - **Testing:** Test metrics collection, tracing, error tracking
   - **Verification:** All observability tools integrated and working

### Task 1.5: CI/CD Pipeline Setup

**Objective:** Set up continuous integration and deployment

**Subtasks:**

1. **1.5.1: Configure Build Pipeline**
   - Set up GitHub Actions / GitLab CI / Jenkins
   - Configure build steps (compile, test, package)
   - Configure code quality checks
   - Configure artifact publishing
   - **Review Checkpoint:** Review CI/CD configuration
   - **Testing:** Trigger build, verify all steps pass
   - **Verification:** Build pipeline works, artifacts published

2. **1.5.2: Configure Test Pipeline**
   - Set up unit test execution
   - Set up integration test execution
   - Configure test coverage reporting
   - **Review Checkpoint:** Review test pipeline
   - **Testing:** Run tests, verify coverage reports
   - **Verification:** Tests run, coverage reports generated

3. **1.5.3: Configure Deployment Pipeline**
   - Set up deployment to staging environment
   - Configure deployment to production
   - Set up rollback procedures
   - **Review Checkpoint:** Review deployment pipeline
   - **Testing:** Deploy to staging, verify deployment works
   - **Verification:** Deployment successful, services healthy

### Phase 1 Review & Sign-off

**Review Checklist:**

- ✅ All project modules created and building
- ✅ Database schemas migrated to JPA entities
- ✅ Infrastructure configured and working
- ✅ Shared libraries created
- ✅ CI/CD pipeline functional
- ✅ All tests passing
- ✅ Documentation complete

**Sign-off Required:** Yes  
**Next Phase:** Phase 2 - Profile Service Migration (POC)

---

## Phase 2: Profile Service Migration (POC)

**Duration:** 2-3 weeks  
**Complexity:** Low  
**Dependencies:** Phase 1 complete

### Task 2.1: Service Setup

**Objective:** Set up Profile Service Spring Boot application

**Subtasks:**

1. **2.1.1: Create Spring Boot Application**
   - Create main application class
   - Configure application properties
   - Set up package structure (controllers, services, repositories)
   - Configure component scanning
   - **Review Checkpoint:** Review application structure
   - **Testing:** Start application, verify it starts without errors
   - **Verification:** Application starts, health endpoint responds

2. **2.1.2: Configure Database**
   - Configure DataSource for Profile database
   - Set up JPA repositories
   - Configure transaction management
   - **Review Checkpoint:** Review database configuration
   - **Testing:** Test database connection, test repository queries
   - **Verification:** Database accessible, repositories work

3. **2.1.3: Configure Redis Cache**
   - Set up Redis connection
   - Configure cache manager
   - Set up cache annotations
   - **Review Checkpoint:** Review cache configuration
   - **Testing:** Test cache operations (get, put, evict)
   - **Verification:** Caching works correctly

### Task 2.2: Domain Layer Implementation

**Objective:** Implement entities, repositories, and domain logic

**Subtasks:**

1. **2.2.1: Implement Repositories**
   - Create `UserRepository` interface
   - Create `UserProfileRepository` interface
   - Create `UserPreferencesRepository` interface
   - Add custom query methods
   - **Review Checkpoint:** Review repository interfaces and queries
   - **Testing:** Unit tests for repositories, test queries
   - **Verification:** All repositories work, queries return correct data

2. **2.2.2: Implement Service Layer**
   - Create `ProfileService` interface and implementation
   - Implement `getProfile(userId)` method
   - Implement `updateProfile(userId, profileData)` method
   - Implement `getPreferences(userId)` method
   - Implement `updatePreferences(userId, preferences)` method
   - Add business logic validation
   - **Review Checkpoint:** Review service implementation, business logic
   - **Testing:** Unit tests for all service methods, test edge cases
   - **Verification:** All service methods work, business logic correct

3. **2.2.3: Implement DTOs and Mappers**
   - Create request DTOs (matching API contracts)
   - Create response DTOs (matching API contracts)
   - Create mapper classes (Entity ↔ DTO)
   - **Review Checkpoint:** Review DTOs match API contracts
   - **Testing:** Unit tests for mappers
   - **Verification:** DTOs match contracts, mappers work correctly

### Task 2.3: API Layer Implementation

**Objective:** Implement REST controllers and validation

**Subtasks:**

1. **2.3.1: Implement Controllers**
   - Create `ProfileController`
   - Implement `GET /api/profile/:userId` endpoint
   - Implement `PUT /api/profile/:userId` endpoint
   - Implement `GET /api/profile/:userId/preferences` endpoint
   - Implement `PUT /api/profile/:userId/preferences` endpoint
   - Add request validation (Bean Validation)
   - **Review Checkpoint:** Review controller implementation, endpoints
   - **Testing:** Unit tests for controllers, test request/response
   - **Verification:** All endpoints work, validation works

2. **2.3.2: Implement Authentication Middleware**
   - Integrate Spring Security
   - Configure JWT authentication filter
   - Add authentication to endpoints
   - Extract user ID from JWT token
   - **Review Checkpoint:** Review authentication implementation
   - **Testing:** Test authenticated requests, test unauthorized requests
   - **Verification:** Authentication works, unauthorized requests rejected

3. **2.3.3: Implement Error Handling**
   - Create global exception handler
   - Map exceptions to HTTP status codes
   - Create error response DTOs
   - **Review Checkpoint:** Review error handling
   - **Testing:** Test error scenarios, verify error responses
   - **Verification:** Errors handled correctly, proper status codes

### Task 2.4: Event Publishing

**Objective:** Implement RabbitMQ event publishing

**Subtasks:**

1. **2.4.1: Configure RabbitMQ Publisher**
   - Set up Spring AMQP publisher
   - Configure exchange and routing
   - Create event publisher service
   - **Review Checkpoint:** Review RabbitMQ configuration
   - **Testing:** Test event publishing, verify messages in RabbitMQ
   - **Verification:** Events published correctly

2. **2.4.2: Implement Event Publishing**
   - Publish `profile.updated` event
   - Publish `preferences.updated` event
   - Add event publishing to service methods
   - **Review Checkpoint:** Review event publishing logic
   - **Testing:** Test event publishing, verify event payloads
   - **Verification:** Events published with correct payloads

### Task 2.5: Health Endpoints

**Objective:** Implement health check endpoints

**Subtasks:**

1. **2.5.1: Configure Actuator**
   - Add Spring Boot Actuator dependency
   - Configure health endpoints
   - Configure custom health indicators
   - **Review Checkpoint:** Review actuator configuration
   - **Testing:** Test health endpoints
   - **Verification:** Health endpoints respond correctly

2. **2.5.2: Implement Custom Health Checks**
   - Database health check
   - Redis health check
   - RabbitMQ health check
   - **Review Checkpoint:** Review health check implementation
   - **Testing:** Test health checks, test failure scenarios
   - **Verification:** Health checks work correctly

### Task 2.6: Observability Integration

**Objective:** Integrate metrics, tracing, and error tracking

**Subtasks:**

1. **2.6.1: Configure Metrics**
   - Set up Micrometer
   - Add custom metrics (request count, duration, etc.)
   - Configure Prometheus endpoint
   - **Review Checkpoint:** Review metrics configuration
   - **Testing:** Test metrics collection, verify Prometheus endpoint
   - **Verification:** Metrics collected, Prometheus endpoint works

2. **2.6.2: Configure Tracing**
   - Set up OpenTelemetry
   - Add trace instrumentation
   - Configure trace export
   - **Review Checkpoint:** Review tracing configuration
   - **Testing:** Test tracing, verify traces exported
   - **Verification:** Tracing works, traces visible

3. **2.6.3: Configure Error Tracking**
   - Set up Sentry integration
   - Configure error reporting
   - Test error reporting
   - **Review Checkpoint:** Review Sentry configuration
   - **Testing:** Trigger test error, verify Sentry receives it
   - **Verification:** Error tracking works

### Task 2.7: API Documentation

**Objective:** Generate OpenAPI/Swagger documentation

**Subtasks:**

1. **2.7.1: Configure SpringDoc OpenAPI**
   - Add SpringDoc dependency
   - Configure OpenAPI info
   - Add API annotations to controllers
   - **Review Checkpoint:** Review OpenAPI configuration
   - **Testing:** Generate OpenAPI spec, verify it matches API
   - **Verification:** OpenAPI spec generated, matches API contracts

2. **2.7.2: Verify API Contract Compatibility**
   - Compare OpenAPI spec with existing API contract
   - Ensure all endpoints match
   - Ensure request/response schemas match
   - **Review Checkpoint:** Review API contract comparison
   - **Testing:** N/A (verification only)
   - **Verification:** API contracts match exactly

### Task 2.8: Integration Testing

**Objective:** Test Profile Service end-to-end

**Subtasks:**

1. **2.8.1: Create Integration Tests**
   - Test all endpoints
   - Test authentication
   - Test error scenarios
   - Test event publishing
   - **Review Checkpoint:** Review integration tests
   - **Testing:** Run integration tests
   - **Verification:** All integration tests pass

2. **2.8.2: Test API Compatibility**
   - Compare responses with existing Node.js service
   - Test request/response formats
   - Test error responses
   - **Review Checkpoint:** Review API compatibility test results
   - **Testing:** Run compatibility tests
   - **Verification:** API responses match existing service

3. **2.8.3: Performance Testing**
   - Run load tests
   - Compare performance with Node.js service
   - Identify bottlenecks
   - **Review Checkpoint:** Review performance test results
   - **Testing:** Run performance tests
   - **Verification:** Performance acceptable (within 20% of Node.js)

### Phase 2 Review & Sign-off

**Review Checklist:**

- ✅ Profile Service fully implemented
- ✅ All endpoints working
- ✅ Authentication integrated
- ✅ Event publishing working
- ✅ Health endpoints working
- ✅ Observability integrated
- ✅ API documentation generated
- ✅ Integration tests passing
- ✅ API compatibility verified
- ✅ Performance acceptable

**Sign-off Required:** Yes  
**Next Phase:** Phase 3 - Auth Service Migration

---

## Phase 3: Auth Service Migration

**Duration:** 3-4 weeks  
**Complexity:** Medium  
**Dependencies:** Phase 2 complete

### Task 3.1: Service Setup

**Objective:** Set up Auth Service Spring Boot application

**Subtasks:**

1. **3.1.1: Create Spring Boot Application**
   - Create main application class
   - Configure application properties
   - Set up package structure
   - **Review Checkpoint:** Review application structure
   - **Testing:** Start application, verify it starts
   - **Verification:** Application starts successfully

2. **3.1.2: Configure Database**
   - Configure DataSource for Auth database
   - Set up JPA repositories
   - **Review Checkpoint:** Review database configuration
   - **Testing:** Test database connection
   - **Verification:** Database accessible

3. **3.1.3: Configure Redis**
   - Set up Redis for token storage
   - Configure cache manager
   - **Review Checkpoint:** Review Redis configuration
   - **Testing:** Test Redis operations
   - **Verification:** Redis works

### Task 3.2: Domain Layer Implementation

**Objective:** Implement entities, repositories, and domain logic

**Subtasks:**

1. **3.2.1: Implement Repositories**
   - Create `UserRepository`
   - Create `DeviceRepository`
   - Create `RefreshTokenRepository`
   - Add custom query methods
   - **Review Checkpoint:** Review repositories
   - **Testing:** Unit tests for repositories
   - **Verification:** Repositories work correctly

2. **3.2.2: Implement Service Layer**
   - Create `AuthService` interface and implementation
   - Implement `register(userData)` method
   - Implement `login(email, password)` method
   - Implement `logout(userId, deviceId)` method
   - Implement `refreshToken(refreshToken)` method
   - Implement `validateToken(token)` method
   - Implement password hashing (BCrypt)
   - **Review Checkpoint:** Review service implementation
   - **Testing:** Unit tests for all service methods
   - **Verification:** All service methods work correctly

3. **3.2.3: Implement JWT Token Management**
   - Create JWT token generator
   - Create JWT token validator
   - Implement access token generation
   - Implement refresh token generation
   - Implement token refresh logic
   - **Review Checkpoint:** Review JWT implementation
   - **Testing:** Unit tests for JWT operations
   - **Verification:** JWT tokens generated and validated correctly

4. **3.2.4: Implement Device Management**
   - Implement device registration
   - Implement device listing
   - Implement device deletion
   - **Review Checkpoint:** Review device management
   - **Testing:** Unit tests for device operations
   - **Verification:** Device management works

### Task 3.3: API Layer Implementation

**Objective:** Implement REST controllers

**Subtasks:**

1. **3.3.1: Implement Controllers**
   - Create `AuthController`
   - Implement `POST /api/auth/register` endpoint
   - Implement `POST /api/auth/login` endpoint
   - Implement `POST /api/auth/logout` endpoint
   - Implement `POST /api/auth/refresh` endpoint
   - Implement `POST /api/auth/validate` endpoint
   - Add request validation
   - **Review Checkpoint:** Review controller implementation
   - **Testing:** Unit tests for controllers
   - **Verification:** All endpoints work correctly

2. **3.3.2: Implement Spring Security**
   - Configure Spring Security
   - Set up JWT authentication filter
   - Configure password encoder (BCrypt)
   - Configure security rules
   - **Review Checkpoint:** Review Spring Security configuration
   - **Testing:** Test authentication flow
   - **Verification:** Authentication works correctly

3. **3.3.3: Implement Error Handling**
   - Create exception handlers
   - Map auth-specific exceptions
   - **Review Checkpoint:** Review error handling
   - **Testing:** Test error scenarios
   - **Verification:** Errors handled correctly

### Task 3.4: Event Publishing

**Objective:** Implement RabbitMQ event publishing

**Subtasks:**

1. **3.4.1: Configure RabbitMQ Publisher**
   - Set up Spring AMQP publisher
   - Configure exchanges and routing
   - **Review Checkpoint:** Review RabbitMQ configuration
   - **Testing:** Test event publishing
   - **Verification:** Events published correctly

2. **3.4.2: Implement Event Publishing**
   - Publish `auth.user.registered` event
   - Publish `auth.user.logged_in` event
   - Publish `auth.user.logged_out` event
   - Publish `auth.session.revoked` event
   - **Review Checkpoint:** Review event publishing
   - **Testing:** Test event publishing
   - **Verification:** Events published with correct payloads

### Task 3.5: Health Endpoints & Observability

**Objective:** Implement health checks and observability

**Subtasks:**

1. **3.5.1: Implement Health Endpoints**
   - Configure Actuator
   - Add custom health checks
   - **Review Checkpoint:** Review health endpoints
   - **Testing:** Test health endpoints
   - **Verification:** Health endpoints work

2. **3.5.2: Integrate Observability**
   - Configure metrics
   - Configure tracing
   - Configure error tracking
   - **Review Checkpoint:** Review observability
   - **Testing:** Test observability tools
   - **Verification:** Observability works

### Task 3.6: Integration Testing

**Objective:** Test Auth Service end-to-end

**Subtasks:**

1. **3.6.1: Create Integration Tests**
   - Test registration flow
   - Test login flow
   - Test logout flow
   - Test token refresh flow
   - Test token validation
   - **Review Checkpoint:** Review integration tests
   - **Testing:** Run integration tests
   - **Verification:** All integration tests pass

2. **3.6.2: Test API Compatibility**
   - Compare with existing Node.js service
   - Test JWT token format
   - Test response formats
   - **Review Checkpoint:** Review compatibility test results
   - **Testing:** Run compatibility tests
   - **Verification:** API compatible with existing service

3. **3.6.3: Test Integration with Profile Service**
   - Test that Profile Service can use Auth Service tokens
   - Test event flow between services
   - **Review Checkpoint:** Review integration test results
   - **Testing:** Run integration tests
   - **Verification:** Services integrate correctly

### Phase 3 Review & Sign-off

**Review Checklist:**

- ✅ Auth Service fully implemented
- ✅ All endpoints working
- ✅ JWT token management working
- ✅ Device management working
- ✅ Event publishing working
- ✅ Integration with Profile Service verified
- ✅ All tests passing

**Sign-off Required:** Yes  
**Next Phase:** Phase 4 - Payments Service Migration (can run parallel with Phase 5)

---

## Phase 4: Payments Service Migration

**Duration:** 3-4 weeks  
**Complexity:** Medium-High  
**Dependencies:** Phase 3 complete

### Task 4.1: Service Setup

**Objective:** Set up Payments Service Spring Boot application

**Subtasks:**

1. **4.1.1: Create Spring Boot Application**
   - Create main application class
   - Configure application properties
   - Set up package structure
   - **Review Checkpoint:** Review application structure
   - **Testing:** Start application
   - **Verification:** Application starts

2. **4.1.2: Configure Database**
   - Configure DataSource for Payments database
   - Set up JPA repositories
   - **Review Checkpoint:** Review database configuration
   - **Testing:** Test database connection
   - **Verification:** Database accessible

3. **4.1.3: Configure Redis**
   - Set up Redis for caching
   - **Review Checkpoint:** Review Redis configuration
   - **Testing:** Test Redis operations
   - **Verification:** Redis works

### Task 4.2: Domain Layer Implementation

**Objective:** Implement entities, repositories, and domain logic

**Subtasks:**

1. **4.2.1: Implement Repositories**
   - Create `PaymentRepository`
   - Create `TransactionRepository`
   - Create denormalized `UserRepository` (zero-coupling)
   - Add custom query methods
   - **Review Checkpoint:** Review repositories, zero-coupling pattern
   - **Testing:** Unit tests for repositories
   - **Verification:** Repositories work correctly

2. **4.2.2: Implement Service Layer**
   - Create `PaymentService` interface and implementation
   - Implement `createPayment(paymentData)` method (stubbed)
   - Implement `getPayment(paymentId)` method
   - Implement `listPayments(userId)` method
   - Implement `getTransaction(transactionId)` method
   - Implement transaction management
   - **Review Checkpoint:** Review service implementation
   - **Testing:** Unit tests for all service methods
   - **Verification:** All service methods work

### Task 4.3: API Layer Implementation

**Objective:** Implement REST controllers

**Subtasks:**

1. **4.3.1: Implement Controllers**
   - Create `PaymentController`
   - Implement `POST /api/payments` endpoint
   - Implement `GET /api/payments/:paymentId` endpoint
   - Implement `GET /api/payments` endpoint (list)
   - Implement `GET /api/payments/:paymentId/transaction` endpoint
   - Add request validation
   - **Review Checkpoint:** Review controller implementation
   - **Testing:** Unit tests for controllers
   - **Verification:** All endpoints work

2. **4.3.2: Implement Authentication**
   - Integrate Spring Security
   - Add JWT authentication
   - **Review Checkpoint:** Review authentication
   - **Testing:** Test authenticated requests
   - **Verification:** Authentication works

3. **4.3.3: Implement Error Handling**
   - Create exception handlers
   - Map payment-specific exceptions
   - **Review Checkpoint:** Review error handling
   - **Testing:** Test error scenarios
   - **Verification:** Errors handled correctly

### Task 4.4: Event Publishing & Subscribing

**Objective:** Implement RabbitMQ event handling

**Subtasks:**

1. **4.4.1: Configure RabbitMQ Publisher**
   - Set up Spring AMQP publisher
   - **Review Checkpoint:** Review publisher configuration
   - **Testing:** Test event publishing
   - **Verification:** Events published correctly

2. **4.4.2: Configure RabbitMQ Subscriber**
   - Set up Spring AMQP subscriber
   - Configure message listeners
   - **Review Checkpoint:** Review subscriber configuration
   - **Testing:** Test event subscription
   - **Verification:** Events received correctly

3. **4.4.3: Implement Event Publishing**
   - Publish `payment.created` event
   - Publish `payment.updated` event
   - Publish `transaction.completed` event
   - **Review Checkpoint:** Review event publishing
   - **Testing:** Test event publishing
   - **Verification:** Events published correctly

4. **4.4.4: Implement Event Subscribing**
   - Subscribe to `auth.user.registered` event
   - Subscribe to `auth.user.logged_in` event
   - Update denormalized user data on events
   - **Review Checkpoint:** Review event subscription logic
   - **Testing:** Test event subscription, verify user data updated
   - **Verification:** Events received, user data updated correctly

### Task 4.5: Health Endpoints & Observability

**Objective:** Implement health checks and observability

**Subtasks:**

1. **4.5.1: Implement Health Endpoints**
   - Configure Actuator
   - Add custom health checks
   - **Review Checkpoint:** Review health endpoints
   - **Testing:** Test health endpoints
   - **Verification:** Health endpoints work

2. **4.5.2: Integrate Observability**
   - Configure metrics
   - Configure tracing
   - Configure error tracking
   - **Review Checkpoint:** Review observability
   - **Testing:** Test observability tools
   - **Verification:** Observability works

### Task 4.6: Integration Testing

**Objective:** Test Payments Service end-to-end

**Subtasks:**

1. **4.6.1: Create Integration Tests**
   - Test payment creation flow
   - Test payment retrieval
   - Test payment listing
   - Test event publishing
   - Test event subscription
   - **Review Checkpoint:** Review integration tests
   - **Testing:** Run integration tests
   - **Verification:** All integration tests pass

2. **4.6.2: Test API Compatibility**
   - Compare with existing Node.js service
   - Test response formats
   - **Review Checkpoint:** Review compatibility test results
   - **Testing:** Run compatibility tests
   - **Verification:** API compatible

3. **4.6.3: Test Event Flow**
   - Test event publishing to other services
   - Test event subscription from other services
   - **Review Checkpoint:** Review event flow test results
   - **Testing:** Run event flow tests
   - **Verification:** Event flow works correctly

### Phase 4 Review & Sign-off

**Review Checklist:**

- ✅ Payments Service fully implemented
- ✅ All endpoints working
- ✅ Event publishing/subscribing working
- ✅ Zero-coupling pattern maintained
- ✅ All tests passing

**Sign-off Required:** Yes  
**Next Phase:** Phase 5 - Admin Service Migration (can run parallel with Phase 4)

---

## Phase 5: Admin Service Migration

**Duration:** 2-3 weeks  
**Complexity:** Low-Medium  
**Dependencies:** Phase 3 complete

### Task 5.1: Service Setup

**Objective:** Set up Admin Service Spring Boot application

**Subtasks:**

1. **5.1.1: Create Spring Boot Application**
   - Create main application class
   - Configure application properties
   - Set up package structure
   - **Review Checkpoint:** Review application structure
   - **Testing:** Start application
   - **Verification:** Application starts

2. **5.1.2: Configure Database**
   - Configure DataSource for Admin database
   - Set up JPA repositories
   - **Review Checkpoint:** Review database configuration
   - **Testing:** Test database connection
   - **Verification:** Database accessible

### Task 5.2: Domain Layer Implementation

**Objective:** Implement entities, repositories, and domain logic

**Subtasks:**

1. **5.2.1: Implement Repositories**
   - Create `AuditLogRepository`
   - Create `SystemHealthRepository` (if needed)
   - Add custom query methods
   - **Review Checkpoint:** Review repositories
   - **Testing:** Unit tests for repositories
   - **Verification:** Repositories work

2. **5.2.2: Implement Service Layer**
   - Create `AdminService` interface and implementation
   - Implement `listUsers()` method
   - Implement `getUser(userId)` method
   - Implement `updateUser(userId, userData)` method
   - Implement `deleteUser(userId)` method
   - Implement `getAuditLogs(filters)` method
   - Implement `getSystemHealth()` method
   - **Review Checkpoint:** Review service implementation
   - **Testing:** Unit tests for all service methods
   - **Verification:** All service methods work

### Task 5.3: API Layer Implementation

**Objective:** Implement REST controllers

**Subtasks:**

1. **5.3.1: Implement Controllers**
   - Create `AdminController`
   - Implement `GET /api/admin/users` endpoint
   - Implement `GET /api/admin/users/:userId` endpoint
   - Implement `PUT /api/admin/users/:userId` endpoint
   - Implement `DELETE /api/admin/users/:userId` endpoint
   - Implement `GET /api/admin/audit-logs` endpoint
   - Implement `GET /api/admin/health` endpoint
   - Add request validation
   - **Review Checkpoint:** Review controller implementation
   - **Testing:** Unit tests for controllers
   - **Verification:** All endpoints work

2. **5.3.2: Implement RBAC**
   - Configure role-based access control
   - Add `@PreAuthorize("hasRole('ADMIN')")` annotations
   - **Review Checkpoint:** Review RBAC implementation
   - **Testing:** Test admin access, test non-admin access
   - **Verification:** RBAC works correctly

3. **5.3.3: Implement Error Handling**
   - Create exception handlers
   - Map admin-specific exceptions
   - **Review Checkpoint:** Review error handling
   - **Testing:** Test error scenarios
   - **Verification:** Errors handled correctly

### Task 5.4: Event Subscribing

**Objective:** Implement RabbitMQ event subscription

**Subtasks:**

1. **5.4.1: Configure RabbitMQ Subscriber**
   - Set up Spring AMQP subscriber
   - Configure message listeners
   - **Review Checkpoint:** Review subscriber configuration
   - **Testing:** Test event subscription
   - **Verification:** Events received correctly

2. **5.4.2: Implement Event Subscribing**
   - Subscribe to `auth.user.registered` event
   - Subscribe to `auth.user.logged_in` event
   - Subscribe to `auth.user.logged_out` event
   - Subscribe to `payment.created` event
   - Create audit logs for subscribed events
   - **Review Checkpoint:** Review event subscription logic
   - **Testing:** Test event subscription, verify audit logs created
   - **Verification:** Events received, audit logs created correctly

### Task 5.5: Health Endpoints & Observability

**Objective:** Implement health checks and observability

**Subtasks:**

1. **5.5.1: Implement Health Endpoints**
   - Configure Actuator
   - Add custom health checks
   - **Review Checkpoint:** Review health endpoints
   - **Testing:** Test health endpoints
   - **Verification:** Health endpoints work

2. **5.5.2: Integrate Observability**
   - Configure metrics
   - Configure tracing
   - Configure error tracking
   - **Review Checkpoint:** Review observability
   - **Testing:** Test observability tools
   - **Verification:** Observability works

### Task 5.6: Integration Testing

**Objective:** Test Admin Service end-to-end

**Subtasks:**

1. **5.6.1: Create Integration Tests**
   - Test user management endpoints
   - Test audit log endpoints
   - Test system health endpoint
   - Test RBAC
   - Test event subscription
   - **Review Checkpoint:** Review integration tests
   - **Testing:** Run integration tests
   - **Verification:** All integration tests pass

2. **5.6.2: Test API Compatibility**
   - Compare with existing Node.js service
   - Test response formats
   - **Review Checkpoint:** Review compatibility test results
   - **Testing:** Run compatibility tests
   - **Verification:** API compatible

### Phase 5 Review & Sign-off

**Review Checklist:**

- ✅ Admin Service fully implemented
- ✅ All endpoints working
- ✅ RBAC working
- ✅ Event subscription working
- ✅ All tests passing

**Sign-off Required:** Yes  
**Next Phase:** Phase 6 - API Gateway Migration

---

## Phase 6: API Gateway Migration

**Duration:** 4-6 weeks  
**Complexity:** Very High  
**Dependencies:** Phases 3, 4, 5 complete

### Task 6.1: Service Setup

**Objective:** Set up API Gateway Spring Boot application

**Subtasks:**

1. **6.1.1: Create Spring Boot Application**
   - Create main application class
   - Configure application properties
   - Set up package structure
   - **Review Checkpoint:** Review application structure
   - **Testing:** Start application
   - **Verification:** Application starts

2. **6.1.2: Configure Spring Cloud Gateway**
   - Add Spring Cloud Gateway dependency
   - Configure gateway routes
   - Configure route predicates
   - Configure route filters
   - **Review Checkpoint:** Review gateway configuration
   - **Testing:** Test basic routing
   - **Verification:** Routing works

### Task 6.2: Streaming HTTP Proxy Implementation

**Objective:** Implement zero-buffering streaming proxy

**Subtasks:**

1. **6.2.1: Research Streaming Options**
   - Research Spring Cloud Gateway streaming capabilities
   - Research WebFlux reactive streaming
   - Research custom proxy implementation
   - **Review Checkpoint:** Review research findings, decide approach
   - **Testing:** N/A (research only)
   - **Verification:** Approach decided, documented

2. **6.2.2: Implement Custom Streaming Proxy**
   - Create custom proxy filter using WebFlux
   - Implement request streaming (no buffering)
   - Implement response streaming (no buffering)
   - Implement header forwarding
   - Implement path rewriting
   - **Review Checkpoint:** Review streaming proxy implementation
   - **Testing:** Test streaming proxy, verify no buffering
   - **Verification:** Streaming proxy works, zero buffering confirmed

3. **6.2.3: Configure Proxy Routes**
   - Configure `/api/auth/*` → Auth Service (3001)
   - Configure `/api/payments/*` → Payments Service (3002)
   - Configure `/api/admin/*` → Admin Service (3003)
   - Configure `/api/profile/*` → Profile Service (3004)
   - **Review Checkpoint:** Review route configuration
   - **Testing:** Test all proxy routes
   - **Verification:** All routes proxy correctly

4. **6.2.4: Implement Error Handling**
   - Handle 502 (Bad Gateway) errors
   - Handle 504 (Gateway Timeout) errors
   - Implement timeout configuration
   - **Review Checkpoint:** Review error handling
   - **Testing:** Test error scenarios
   - **Verification:** Errors handled correctly

### Task 6.3: WebSocket Server Implementation

**Objective:** Implement WebSocket server with authentication

**Subtasks:**

1. **6.3.1: Configure Spring WebSocket**
   - Add Spring WebSocket dependency
   - Configure WebSocket endpoint
   - Configure STOMP protocol (or raw WebSocket)
   - **Review Checkpoint:** Review WebSocket configuration
   - **Testing:** Test WebSocket connection
   - **Verification:** WebSocket connection works

2. **6.3.2: Implement WebSocket Authentication**
   - Implement JWT token validation on connection
   - Extract user ID and role from token
   - Store connection metadata
   - **Review Checkpoint:** Review authentication implementation
   - **Testing:** Test authenticated connections, test unauthorized
   - **Verification:** Authentication works

3. **6.3.3: Implement Connection Management**
   - Implement connection manager
   - Implement room management (user-specific rooms)
   - Implement heartbeat mechanism
   - **Review Checkpoint:** Review connection management
   - **Testing:** Test connection management, test room management
   - **Verification:** Connection management works

4. **6.3.4: Implement Event Bridge**
   - Subscribe to RabbitMQ events
   - Forward events to WebSocket clients
   - Route events to user-specific rooms
   - **Review Checkpoint:** Review event bridge implementation
   - **Testing:** Test event forwarding, test room routing
   - **Verification:** Events forwarded correctly

### Task 6.4: GraphQL Server Implementation

**Objective:** Implement GraphQL API

**Subtasks:**

1. **6.4.1: Configure Spring GraphQL**
   - Add Spring GraphQL dependency
   - Create GraphQL schema
   - Configure GraphQL endpoint
   - **Review Checkpoint:** Review GraphQL configuration
   - **Testing:** Test GraphQL endpoint
   - **Verification:** GraphQL endpoint works

2. **6.4.2: Implement GraphQL Schema**
   - Define types (User, Payment, etc.)
   - Define queries
   - Define mutations
   - **Review Checkpoint:** Review GraphQL schema
   - **Testing:** Test GraphQL queries and mutations
   - **Verification:** GraphQL schema works

3. **6.4.3: Implement GraphQL Resolvers**
   - Implement query resolvers
   - Implement mutation resolvers
   - Implement field resolvers
   - **Review Checkpoint:** Review resolver implementation
   - **Testing:** Test all resolvers
   - **Verification:** Resolvers work correctly

4. **6.4.4: Implement GraphQL Directives**
   - Implement `@auth` directive
   - Implement `@admin` directive
   - **Review Checkpoint:** Review directive implementation
   - **Testing:** Test directives, test authorization
   - **Verification:** Directives work correctly

### Task 6.5: Authentication & Authorization

**Objective:** Implement JWT authentication and RBAC

**Subtasks:**

1. **6.5.1: Configure Spring Security**
   - Add Spring Security dependency
   - Configure security rules
   - Configure JWT authentication
   - **Review Checkpoint:** Review Spring Security configuration
   - **Testing:** Test authentication
   - **Verification:** Authentication works

2. **6.5.2: Implement JWT Filter**
   - Create JWT authentication filter
   - Extract token from request
   - Validate token
   - Set authentication context
   - **Review Checkpoint:** Review JWT filter implementation
   - **Testing:** Test JWT validation
   - **Verification:** JWT validation works

3. **6.5.3: Implement RBAC**
   - Configure role-based access
   - Add role checks to endpoints
   - **Review Checkpoint:** Review RBAC implementation
   - **Testing:** Test role-based access
   - **Verification:** RBAC works correctly

### Task 6.6: Rate Limiting

**Objective:** Implement rate limiting

**Subtasks:**

1. **6.6.1: Configure Rate Limiting**
   - Add rate limiting dependency (Redis-based)
   - Configure rate limit rules
   - Configure rate limit per endpoint
   - **Review Checkpoint:** Review rate limiting configuration
   - **Testing:** Test rate limiting
   - **Verification:** Rate limiting works

2. **6.6.2: Implement Rate Limit Filters**
   - Create custom rate limit filters
   - Apply to gateway routes
   - **Review Checkpoint:** Review rate limit filters
   - **Testing:** Test rate limit enforcement
   - **Verification:** Rate limits enforced correctly

### Task 6.7: Swagger/OpenAPI Documentation

**Objective:** Generate API documentation

**Subtasks:**

1. **6.7.1: Configure SpringDoc OpenAPI**
   - Add SpringDoc dependency
   - Configure OpenAPI info
   - Configure Swagger UI
   - **Review Checkpoint:** Review OpenAPI configuration
   - **Testing:** Generate OpenAPI spec
   - **Verification:** OpenAPI spec generated

2. **6.7.2: Document All Endpoints**
   - Add API annotations to controllers
   - Document request/response schemas
   - **Review Checkpoint:** Review API documentation
   - **Testing:** Verify Swagger UI displays all endpoints
   - **Verification:** All endpoints documented

### Task 6.8: Health Endpoints

**Objective:** Implement health check endpoints

**Subtasks:**

1. **6.8.1: Configure Actuator**
   - Add Spring Boot Actuator
   - Configure health endpoints
   - **Review Checkpoint:** Review actuator configuration
   - **Testing:** Test health endpoints
   - **Verification:** Health endpoints work

2. **6.8.2: Implement Custom Health Checks**
   - Database health check
   - RabbitMQ health check
   - Redis health check
   - Downstream service health checks
   - **Review Checkpoint:** Review health checks
   - **Testing:** Test all health checks
   - **Verification:** Health checks work correctly

### Task 6.9: Observability Integration

**Objective:** Integrate metrics, tracing, and error tracking

**Subtasks:**

1. **6.9.1: Configure Metrics**
   - Set up Micrometer
   - Add custom metrics
   - Configure Prometheus endpoint
   - **Review Checkpoint:** Review metrics configuration
   - **Testing:** Test metrics collection
   - **Verification:** Metrics collected correctly

2. **6.9.2: Configure Tracing**
   - Set up OpenTelemetry
   - Add trace instrumentation
   - **Review Checkpoint:** Review tracing configuration
   - **Testing:** Test tracing
   - **Verification:** Tracing works

3. **6.9.3: Configure Error Tracking**
   - Set up Sentry integration
   - Configure error reporting
   - **Review Checkpoint:** Review Sentry configuration
   - **Testing:** Test error reporting
   - **Verification:** Error tracking works

### Task 6.10: Integration Testing

**Objective:** Test API Gateway end-to-end

**Subtasks:**

1. **6.10.1: Create Integration Tests**
   - Test proxy routes
   - Test WebSocket connections
   - Test GraphQL queries/mutations
   - Test authentication
   - Test rate limiting
   - **Review Checkpoint:** Review integration tests
   - **Testing:** Run integration tests
   - **Verification:** All integration tests pass

2. **6.10.2: Test API Compatibility**
   - Compare with existing Node.js gateway
   - Test all endpoints
   - Test response formats
   - **Review Checkpoint:** Review compatibility test results
   - **Testing:** Run compatibility tests
   - **Verification:** API compatible

3. **6.10.3: Performance Testing**
   - Run load tests
   - Compare performance with Node.js gateway
   - Test streaming proxy performance
   - **Review Checkpoint:** Review performance test results
   - **Testing:** Run performance tests
   - **Verification:** Performance acceptable

### Phase 6 Review & Sign-off

**Review Checklist:**

- ✅ API Gateway fully implemented
- ✅ Streaming proxy working (zero buffering)
- ✅ WebSocket server working
- ✅ GraphQL server working
- ✅ Authentication and authorization working
- ✅ Rate limiting working
- ✅ All tests passing
- ✅ Performance acceptable

**Sign-off Required:** Yes  
**Next Phase:** Phase 7 - Testing & Validation

---

## Phase 7: Testing & Validation

**Duration:** 3-4 weeks  
**Complexity:** Medium  
**Dependencies:** All previous phases complete

### Task 7.1: Comprehensive Unit Testing

**Objective:** Ensure all services have comprehensive unit tests

**Subtasks:**

1. **7.1.1: Review Unit Test Coverage**
   - Check coverage for all services
   - Identify gaps in coverage
   - **Review Checkpoint:** Review coverage reports
   - **Testing:** Generate coverage reports
   - **Verification:** Coverage meets minimum threshold (70%+)

2. **7.1.2: Add Missing Unit Tests**
   - Write tests for uncovered code
   - Write tests for edge cases
   - **Review Checkpoint:** Review new tests
   - **Testing:** Run all unit tests
   - **Verification:** All unit tests pass, coverage improved

### Task 7.2: Integration Testing

**Objective:** Test service-to-service integration

**Subtasks:**

1. **7.2.1: Test Service Communication**
   - Test API Gateway → Auth Service
   - Test API Gateway → Payments Service
   - Test API Gateway → Admin Service
   - Test API Gateway → Profile Service
   - **Review Checkpoint:** Review integration test results
   - **Testing:** Run integration tests
   - **Verification:** All service communications work

2. **7.2.2: Test Event Flow**
   - Test event publishing from all services
   - Test event subscription in all services
   - Test event routing through RabbitMQ
   - **Review Checkpoint:** Review event flow test results
   - **Testing:** Run event flow tests
   - **Verification:** Event flow works correctly

3. **7.2.3: Test Authentication Flow**
   - Test registration → login → token usage
   - Test token refresh
   - Test token validation across services
   - **Review Checkpoint:** Review authentication test results
   - **Testing:** Run authentication flow tests
   - **Verification:** Authentication flow works end-to-end

### Task 7.3: End-to-End Testing

**Objective:** Test complete user journeys

**Subtasks:**

1. **7.3.1: Test User Registration Journey**
   - Register new user
   - Verify user created in Auth Service
   - Verify profile created in Profile Service
   - Verify events published
   - **Review Checkpoint:** Review E2E test results
   - **Testing:** Run E2E tests
   - **Verification:** Registration journey works

2. **7.3.2: Test Payment Journey**
   - Login as user
   - Create payment
   - Verify payment created
   - Verify events published
   - **Review Checkpoint:** Review E2E test results
   - **Testing:** Run E2E tests
   - **Verification:** Payment journey works

3. **7.3.3: Test Admin Journey**
   - Login as admin
   - Access admin endpoints
   - Verify RBAC
   - **Review Checkpoint:** Review E2E test results
   - **Testing:** Run E2E tests
   - **Verification:** Admin journey works

### Task 7.4: API Compatibility Testing

**Objective:** Verify API compatibility with existing Node.js services

**Subtasks:**

1. **7.4.1: Compare API Contracts**
   - Compare OpenAPI specs
   - Verify all endpoints match
   - Verify request/response schemas match
   - **Review Checkpoint:** Review API contract comparison
   - **Testing:** Automated contract comparison
   - **Verification:** All contracts match

2. **7.4.2: Test Response Compatibility**
   - Test all endpoints
   - Compare responses with Node.js services
   - Verify response formats match
   - **Review Checkpoint:** Review compatibility test results
   - **Testing:** Run compatibility tests
   - **Verification:** All responses compatible

### Task 7.5: Performance Testing

**Objective:** Validate performance meets requirements

**Subtasks:**

1. **7.5.1: Run Load Tests**
   - Test all services under load
   - Identify bottlenecks
   - **Review Checkpoint:** Review load test results
   - **Testing:** Run load tests
   - **Verification:** Performance acceptable

2. **7.5.2: Compare Performance**
   - Compare with Node.js services
   - Verify performance is within acceptable range (within 20%)
   - **Review Checkpoint:** Review performance comparison
   - **Testing:** Run performance comparison tests
   - **Verification:** Performance acceptable

3. **7.5.3: Optimize Performance**
   - Address identified bottlenecks
   - Optimize database queries
   - Optimize caching
   - **Review Checkpoint:** Review optimizations
   - **Testing:** Re-run performance tests
   - **Verification:** Performance improved

### Task 7.6: Security Testing

**Objective:** Validate security implementation

**Subtasks:**

1. **7.6.1: Test Authentication Security**
   - Test JWT token validation
   - Test token expiration
   - Test unauthorized access
   - **Review Checkpoint:** Review security test results
   - **Testing:** Run security tests
   - **Verification:** Authentication secure

2. **7.6.2: Test Authorization Security**
   - Test RBAC
   - Test unauthorized endpoint access
   - **Review Checkpoint:** Review security test results
   - **Testing:** Run security tests
   - **Verification:** Authorization secure

3. **7.6.3: Test Input Validation**
   - Test SQL injection prevention
   - Test XSS prevention
   - Test input sanitization
   - **Review Checkpoint:** Review security test results
   - **Testing:** Run security tests
   - **Verification:** Input validation secure

### Task 7.7: Observability Validation

**Objective:** Verify observability tools working

**Subtasks:**

1. **7.7.1: Test Metrics Collection**
   - Verify Prometheus metrics collected
   - Verify metrics exposed correctly
   - **Review Checkpoint:** Review metrics
   - **Testing:** Check Prometheus endpoint
   - **Verification:** Metrics collected correctly

2. **7.7.2: Test Tracing**
   - Verify OpenTelemetry traces generated
   - Verify traces exported correctly
   - **Review Checkpoint:** Review traces
   - **Testing:** Check trace export
   - **Verification:** Tracing works correctly

3. **7.7.3: Test Error Tracking**
   - Verify Sentry receives errors
   - Test error reporting
   - **Review Checkpoint:** Review error tracking
   - **Testing:** Trigger test error
   - **Verification:** Error tracking works

### Phase 7 Review & Sign-off

**Review Checklist:**

- ✅ All unit tests passing (70%+ coverage)
- ✅ All integration tests passing
- ✅ All E2E tests passing
- ✅ API compatibility verified
- ✅ Performance acceptable
- ✅ Security validated
- ✅ Observability working

**Sign-off Required:** Yes  
**Next Phase:** Phase 8 - Deployment & Rollout

---

## Phase 8: Deployment & Rollout

**Duration:** 1-2 weeks  
**Complexity:** Medium  
**Dependencies:** Phase 7 complete

### Task 8.1: Staging Deployment

**Objective:** Deploy to staging environment

**Subtasks:**

1. **8.1.1: Prepare Staging Environment**
   - Set up staging infrastructure
   - Configure staging databases
   - Configure staging RabbitMQ
   - Configure staging Redis
   - **Review Checkpoint:** Review staging environment
   - **Testing:** Verify staging environment
   - **Verification:** Staging environment ready

2. **8.1.2: Deploy Services to Staging**
   - Deploy Profile Service
   - Deploy Auth Service
   - Deploy Payments Service
   - Deploy Admin Service
   - Deploy API Gateway
   - **Review Checkpoint:** Review deployment
   - **Testing:** Test all services in staging
   - **Verification:** All services deployed and working

3. **8.1.3: Verify Staging Deployment**
   - Test all endpoints
   - Test service integration
   - Test event flow
   - **Review Checkpoint:** Review staging verification
   - **Testing:** Run full test suite in staging
   - **Verification:** All tests pass in staging

### Task 8.2: Parallel Run Period

**Objective:** Run both Node.js and Spring Boot services in parallel

**Subtasks:**

1. **8.2.1: Configure Parallel Routing**
   - Set up nginx to route to both systems
   - Configure traffic splitting (e.g., 10% to Spring Boot)
   - **Review Checkpoint:** Review routing configuration
   - **Testing:** Test traffic routing
   - **Verification:** Traffic routed correctly

2. **8.2.2: Monitor Parallel Run**
   - Monitor both systems
   - Compare metrics
   - Compare error rates
   - **Review Checkpoint:** Review monitoring data
   - **Testing:** Monitor for 1 week
   - **Verification:** Spring Boot system stable

3. **8.2.3: Gradually Increase Traffic**
   - Increase traffic to Spring Boot (10% → 25% → 50% → 100%)
   - Monitor at each step
   - **Review Checkpoint:** Review traffic increase
   - **Testing:** Monitor at each step
   - **Verification:** System handles increased traffic

### Task 8.3: Production Deployment

**Objective:** Deploy to production

**Subtasks:**

1. **8.3.1: Prepare Production Environment**
   - Set up production infrastructure
   - Configure production databases
   - Configure production RabbitMQ
   - Configure production Redis
   - **Review Checkpoint:** Review production environment
   - **Testing:** Verify production environment
   - **Verification:** Production environment ready

2. **8.3.2: Deploy Services to Production**
   - Deploy Profile Service
   - Deploy Auth Service
   - Deploy Payments Service
   - Deploy Admin Service
   - Deploy API Gateway
   - **Review Checkpoint:** Review production deployment
   - **Testing:** Test all services in production
   - **Verification:** All services deployed

3. **8.3.3: Verify Production Deployment**
   - Test all endpoints
   - Monitor system health
   - **Review Checkpoint:** Review production verification
   - **Testing:** Run smoke tests
   - **Verification:** Production system working

### Task 8.4: Cutover & Rollback Plan

**Objective:** Execute cutover and prepare rollback

**Subtasks:**

1. **8.4.1: Execute Cutover**
   - Switch traffic from Node.js to Spring Boot
   - Monitor system closely
   - **Review Checkpoint:** Review cutover execution
   - **Testing:** Monitor system
   - **Verification:** Cutover successful

2. **8.4.2: Prepare Rollback Plan**
   - Document rollback procedure
   - Test rollback procedure
   - **Review Checkpoint:** Review rollback plan
   - **Testing:** Test rollback (in staging)
   - **Verification:** Rollback procedure works

3. **8.4.3: Monitor Post-Cutover**
   - Monitor for 1 week
   - Address any issues
   - **Review Checkpoint:** Review post-cutover monitoring
   - **Testing:** Monitor system
   - **Verification:** System stable

### Task 8.5: Decommission Node.js Services

**Objective:** Remove Node.js services after successful migration

**Subtasks:**

1. **8.5.1: Verify Migration Success**
   - Confirm all functionality working
   - Confirm no issues for 2 weeks
   - **Review Checkpoint:** Review migration success
   - **Testing:** Monitor system
   - **Verification:** Migration successful

2. **8.5.2: Decommission Node.js Services**
   - Stop Node.js services
   - Remove Node.js infrastructure
   - Archive Node.js code
   - **Review Checkpoint:** Review decommissioning
   - **Testing:** Verify services stopped
   - **Verification:** Node.js services decommissioned

### Phase 8 Review & Sign-off

**Review Checklist:**

- ✅ Staging deployment successful
- ✅ Parallel run successful
- ✅ Production deployment successful
- ✅ Cutover successful
- ✅ System stable
- ✅ Node.js services decommissioned

**Sign-off Required:** Yes  
**Migration Complete:** ✅

---

## Risk Mitigation

### High-Risk Areas

1. **Streaming Proxy Implementation**
   - **Risk:** Complex, may not achieve zero buffering
   - **Mitigation:** Research thoroughly, POC early, test extensively
   - **Contingency:** Use nginx for streaming if needed

2. **WebSocket Implementation**
   - **Risk:** Different API, complexity
   - **Mitigation:** Use Spring WebSocket, test early
   - **Contingency:** Consider SignalR if needed

3. **GraphQL Implementation**
   - **Risk:** Different from Apollo Server
   - **Mitigation:** Use Spring GraphQL, test compatibility
   - **Contingency:** Maintain REST API as primary

4. **Performance**
   - **Risk:** May not match Node.js performance
   - **Mitigation:** Performance test early, optimize continuously
   - **Contingency:** Optimize bottlenecks, scale horizontally

5. **Team Expertise**
   - **Risk:** Learning curve for Spring Boot
   - **Mitigation:** Training, pair programming, code reviews
   - **Contingency:** Hire Spring Boot experts if needed

### Risk Monitoring

- Weekly risk assessment meetings
- Track identified risks in risk register
- Update mitigation strategies as needed
- Escalate critical risks immediately

---

## Success Criteria

### Technical Success Criteria

- ✅ All services migrated and functional
- ✅ All API endpoints working and compatible
- ✅ All tests passing (unit, integration, E2E)
- ✅ Performance within 20% of Node.js services
- ✅ Zero critical bugs in production
- ✅ Observability tools integrated and working
- ✅ Security validated and secure

### Business Success Criteria

- ✅ No service downtime during migration
- ✅ No breaking changes to API contracts
- ✅ Migration completed within timeline (4-6 months)
- ✅ Team trained and productive
- ✅ Documentation complete

### Quality Success Criteria

- ✅ Code coverage ≥ 70%
- ✅ All code reviewed and approved
- ✅ All documentation updated
- ✅ All tests passing
- ✅ No security vulnerabilities

---

## Document End

_This migration plan provides a comprehensive, step-by-step guide for migrating from Node.js/Express/TypeScript to Java Spring Boot. Each task includes review checkpoints, testing requirements, and verification steps to ensure quality and minimize risk._
