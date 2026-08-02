# Contributing to BIO-EMS

Thank you for contributing to BIO-EMS.

This document defines the official development workflow, coding standards, documentation requirements, and quality expectations for this project.

---

# Project Philosophy

BIO-EMS is a commercial Environmental Monitoring System designed for pharmaceutical cold rooms and warehouses.

The primary goals of the project are:

- Reliability
- Maintainability
- Scalability
- Simplicity
- Long-term support

Every change should improve the project without increasing unnecessary complexity.

---

# Development Workflow

Every feature follows the same workflow:

1. Analysis
2. Design
3. Documentation
4. Implementation
5. Testing
6. Review
7. Update CHANGELOG
8. Merge

Documentation comes before implementation.

---

# Architecture First

Architecture documents are the source of truth.

If any implementation conflicts with the architecture documentation, the architecture documentation takes precedence.

Never change the architecture without updating the corresponding documentation.

---

# Branch Strategy

Use the following branch naming convention:

feature/<feature-name>

bugfix/<bug-name>

hotfix/<hotfix-name>

docs/<document-name>

refactor/<module-name>

examples

feature/telemetry-pipeline

feature/alarm-engine

docs/database

bugfix/mqtt-parser

---

# Commit Message Convention

Use Conventional Commits.

Examples:

feat(telemetry): add telemetry service

feat(sensor): add resolver

fix(mqtt): validate payload

fix(api): return proper status code

docs(architecture): update mqtt protocol

refactor(repository): simplify queries

test(sensor): add resolver tests

---

# Coding Standards

General

- Write readable code.
- Keep methods small.
- Avoid duplicated logic.
- Use meaningful names.
- Prefer composition over inheritance.
- Avoid premature optimization.

TypeScript

- Enable strict mode.
- Avoid any whenever possible.
- Prefer interfaces.
- Use explicit return types for public methods.

Formatting

- Use consistent formatting.
- Keep imports organized.
- Remove unused code.
- Remove commented code before merge.

---

# Architecture Rules

Current architecture:

Controller

↓

Service

↓

Repository

↓

Database

Controllers

- Receive requests.
- Validate DTOs.
- Return HTTP responses.

Services

- Implement business logic.
- Never access HTTP objects.

Repositories

- Access SQLite only.
- No business logic.

InfluxDB

- Telemetry storage only.

SQLite

- Configuration storage only.

MQTT

- Transport only.

Firmware

- Data acquisition only.

---

# Documentation Requirements

Every major feature must include documentation updates.

Documentation may include:

Architecture

API

Database

Protocol

Deployment

Testing

User Guide

If documentation becomes outdated, update it before merging code.

---

# Testing Requirements

Every new feature should include:

- Manual verification
- API testing
- MQTT testing (if applicable)
- Database verification
- Error handling verification

Critical features should include automated tests whenever practical.

---

# Definition of Done

A task is complete only when:

- Code compiles
- No TypeScript errors
- No lint errors
- Documentation updated
- CHANGELOG updated
- Manual testing completed
- Code reviewed
- Feature works as expected

---

# Pull Request Checklist

Before submitting a Pull Request:

- Architecture respected
- Documentation updated
- CHANGELOG updated
- Tests completed
- No debug code
- No unused imports
- No commented code
- No console.log left in production code

---

# Versioning Policy

BIO-EMS follows Semantic Versioning.

MAJOR

Breaking changes

MINOR

New functionality

PATCH

Bug fixes

Examples:

1.0.0

1.1.0

1.1.1

2.0.0

---

# Changelog Policy

Every completed Sprint must update CHANGELOG.md.

Entries should use Keep a Changelog categories:

Added

Changed

Deprecated

Removed

Fixed

Security

---

# Code Review Guidelines

Reviews should focus on:

Correctness

Readability

Performance

Maintainability

Security

Consistency

Documentation

Constructive feedback is encouraged.

---

# Project Structure

```
src/
controllers/
services/
repositories/
routes/
middleware/
database/
mqtt/
influx/
config/
utils/

docs/
architecture/
api/
deployment/
hardware/
firmware/
testing/
user-guide/
```

Project structure should remain consistent.

---

# Design Principles

Always follow these principles:

Single Source of Truth

Separation of Concerns

Keep It Simple (KISS)

Don't Repeat Yourself (DRY)

YAGNI

Documentation First

Architecture First

---

# Security

Never commit:

Passwords

Secrets

API keys

Certificates

Production credentials

Use environment variables for configuration.

---

# Communication

Significant architectural changes must be discussed before implementation.

Small implementation improvements may proceed without architecture changes.

---

# Maintainers

Project Owner

Ahmed A. Elsheikh

Project

BIO-EMS

Environmental Monitoring System