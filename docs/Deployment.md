---
noteId: "5bceb400900711f1b5a17b27a30409c5"
tags: []

---

# Deployment Guide

## Prerequisites
- Node.js 20+
- MongoDB instance
- Environment variables configured for the backend

## Environment variables
Create a backend environment file with:
- MONGO_URI
- PORT
- JWT_SECRET
- CORS_ORIGIN
- NODE_ENV

## Docker
Build and run with:
- docker compose up --build

## CI/CD
The GitHub Actions workflow builds the frontend and backend on pushes and pull requests.

## Health checks
- Backend health: /api/health
- Use the container healthcheck and logs for operational monitoring.
