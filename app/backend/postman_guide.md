# Postman API Collection & Testing Guide

This guide describes how to run and use the newly created Postman collection to test the Adala AI backend API.

The Postman collection file is saved inside the backend directory:
👉 **[adala-ai-api.postman_collection.json](file:///home/nobody_/Documents/Adala-AI-1/app/backend/adala-ai-api.postman_collection.json)**

---

## 🚀 Getting Started

### 1. Import the Collection
1. Open **Postman**.
2. Click **Import** in the top-left corner.
3. Drag and drop the `adala-ai-api.postman_collection.json` file.
4. Confirm the import to load the **Adala AI Backend API Suite**.

### 2. Run the Local Backend
Make sure the NestJS backend application is running locally:
```bash
npm run start:dev
```
*Note: The default collection variable `base_url` points to `http://localhost:4000`.*

---

## 📂 Collection Structure & Tests

The collection is organized into logically sequenced folders. Test scripts are pre-configured to automate variables management and status verification.

### 🔑 1. Authentication
* **Register New User & Org** (`POST /auth/register`):
  * Registes a new owner (`john.doe@adala.ai`) and creates the `"Adala Legal Intelligence"` organization.
  * **Test Script**: Automatically extracts the `access_token` cookie and saves it to the environment's `{{jwt_token}}` variable.
* **Login User** (`POST /auth/login`):
  * Performs login and updates the session cookies/token.
* **Get Profile** (`GET /auth/profile`):
  * Checks authentication status and displays current user details.
* **Logout** (`POST /auth/logout`):
  * Resets session cookies.

### 📁 2. Project Management
* **Create Project** (`POST /projects`):
  * Creates a new research project (`"Casablanca Commercial Disputes"`).
  * **Test Script**: Automatically captures the returned `id` and stores it to `{{project_id}}`.
* **Get All Projects** (`GET /projects`):
  * Retrieves all projects for the organization (constrained by Row-Level Security).

### 💬 3. Conversation Management
* **Create Conversation** (`POST /conversations`):
  * Creates a chat thread under the newly created project `{{project_id}}`.
  * **Test Script**: Captures the conversation ID to `{{conversation_id}}`.
* **Get Conversations List** (`GET /conversations`)
* **Get Specific Conversation** (`GET /conversations/:id`)
* **Update / Archive / Restore / Delete**

### ✉️ 4. Message Management
* **Send Message** (`POST /messages`):
  * Dispatches a user query.
  * **Test Script**: Stores message ID to `{{message_id}}`.
* **Get Conversation Messages** / **Update Message**

### 📚 5. Legal Source Management
* **Register Legal Source** (`POST /legal-sources`):
  * Indexes custom legal documents/codes.
  * **Test Script**: Stores legal source ID to `{{legal_source_id}}`.

### 🔑 6. API Keys
* **Create API Key** (`POST /api-keys`):
  * Generates an API key (secret only shown on creation).
* **List API Keys** (`GET /api-keys`)

### 📋 7. Audit Logs
* **Get Audit Trail** (`GET /audit-logs`):
  * Displays tracked user and key actions.

---

## ⚡ Automation with Newman (CLI)

You can run these Postman tests directly from your terminal or CI/CD pipelines using **Newman**:

1. Install Newman globally:
   ```bash
   npm install -g newman
   ```
2. Run the test suite:
   ```bash
   newman run adala-ai-api.postman_collection.json
   ```
