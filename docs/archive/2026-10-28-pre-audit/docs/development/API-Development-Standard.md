# BIO-EMS API Development Standard

## Purpose

This document defines the mandatory development standard for all REST APIs in the BIO-EMS project.

Every new API endpoint must follow the same architecture, coding style, validation flow, testing process, and documentation requirements.

This standard ensures consistency, maintainability, scalability, and production readiness.

---

# API Architecture

Every API must follow this flow:

Client

↓

Route

↓

Controller

↓

Service

↓

Repository

↓

Database

Business logic must never exist inside the Controller.

Database access must never exist inside the Controller.

The Service layer contains all business rules.

The Repository layer contains all database operations.

---

# Standard File Structure

A new feature should contain:

routes/

controllers/

services/

repositories/

dto/ (when required)

middleware/ (when required)

---

# Controller Responsibilities

Controllers must:

- Receive HTTP requests
- Read request parameters
- Call Service functions
- Return HTTP responses

Controllers must NOT:

- Access SQLite directly
- Execute SQL
- Contain business rules
- Perform validation logic

Controllers should remain thin.

---

# Service Responsibilities

Services are responsible for:

- Business logic
- Validation
- Workflow
- State transitions
- Throwing AppError when required

All application rules belong inside Services.

---

# Repository Responsibilities

Repositories are responsible only for:

- SQL statements
- CRUD operations
- Database interaction

Repositories must not contain business logic.

---

# Error Handling

BIO-EMS uses AppError for application errors.

Expected errors must throw AppError.

Unexpected errors are handled by the global Error Middleware.

Controllers should not manually build error responses.

---

# API Response Rules

Successful responses:

- HTTP status code
- JSON response

Errors:

Returned by Error Middleware.

---

# Validation

Validation belongs inside the Service layer.

Future DTO validation middleware may be introduced without changing the architecture.

---

# Testing Requirements

Before completing any Sprint:

- Build must succeed
- API must be tested
- SQLite must be verified
- No TypeScript errors
- No Runtime errors

---

# Documentation

Every Sprint introducing new APIs must update:

- Sprint Documentation
- CHANGELOG
- PROJECT_STATE

---

# Git Workflow

Every Sprint ends with:

Build

↓

Testing

↓

Documentation

↓

Commit

↓

Tag

↓

Push

---

# Coding Principles

- Keep Controllers thin.
- Keep Services responsible for business rules.
- Keep Repositories responsible for persistence.
- Avoid duplicated code.
- Maintain backward compatibility whenever possible.

---

# Production Readiness

Every API added to BIO-EMS must be production-ready before merging into the main branch.

Features should not require architectural redesign after the Pilot release.