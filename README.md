# Collaborative Story Writing Platform (ScribbleCollab)

A production-ready full-stack MERN (MongoDB, Express, React, Node.js) application built with React, Vite, Tailwind CSS v4, Express, and JWT authentication. It enables authors to draft stories, invite contributors, review and approve sections, and export completed stories as downloadable PDFs.

---

## Table of Contents
1. [Architecture & Folder Structure](#architecture--folder-structure)
2. [Database Models Schema](#database-models-schema)
3. [API Documentation](#api-documentation)
4. [Setup & Installation](#setup--installation)
   - [Prerequisites](#prerequisites)
   - [Backend Configuration](#backend-configuration)
   - [Frontend Configuration](#frontend-configuration)
   - [Running the Application](#running-the-application)
5. [Key Implementation Highlights](#key-implementation-highlights)

---

## Architecture & Folder Structure

The project has a clean separation of concerns with isolated `backend` and `frontend` folders:

```text
book/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection using Mongoose
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile, and search
│   │   ├── contributionController.js # Story section submissions and review
│   │   ├── invitationController.js   # Collaborator invites accept/reject
│   │   └── storyController.js    # Story CRUD, complete lock, and PDF compile
│   ├── middleware/
│   │   └── authMiddleware.js     # Protect routes via JWT extraction
│   ├── models/
│   │   ├── User.js               # User collection and bcrypt hooks
│   │   ├── Story.js              # Stories collection metadata
│   │   ├── Invitation.js         # Invites statuses tracking
│   │   └── Contribution.js       # Submitted story chunks pending review
│   ├── routes/
│   │   ├── authRoutes.js         # User routes endpoints
│   │   ├── contributionRoutes.js # Contribution routes endpoints
│   │   ├── invitationRoutes.js   # Invitation routes endpoints
│   │   └── storyRoutes.js        # Story and PDF compile routes endpoints
│   ├── utils/
│   │   └── pdfGenerator.js       # PDFKit stream document compiler
│   ├── .env                      # Database & Port configuration
│   ├── .env.example              # Environment template
│   ├── package.json              # Server dependencies
│   └── server.js                 # Server entry point, CORS, error handling
└── frontend/
    ├── src/
    │   ├── assets/               # Local static graphics
    │   ├── components/
    │   │   ├── Layout.jsx        # Sidebar navigation and sidebar draw
    │   │   ├── ProtectedRoute.jsx# Navigation wrapper guarding auth
    │   │   ├── StoryCard.jsx     # Card listing title, state badges, metadata
    │   │   ├── ContributionCard.jsx # Card displaying contributions logs
    │   │   ├── InvitationCard.jsx   # Card managing pending invite actions
    │   │   └── Spinner.jsx       # Smooth loading icon loader
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Auth provider logic (login, register, session)
    │   │   └── ToastContext.jsx  # Floating notifications overlay alerts
    │   ├── pages/
    │   │   ├── CreateStory.jsx   # Create a story form page
    │   │   ├── Dashboard.jsx     # Tabbed view (Stories, invites, contribs)
    │   │   ├── Login.jsx         # Custom sign-in panel
    │   │   ├── Register.jsx      # Custom sign-up panel
    │   │   ├── StoriesFeed.jsx   # Public index of stories with search filters
    │   │   └── StoryDetails.jsx  # Main workspace for read/writing/reviewing
    │   ├── utils/
    │   │   └── api.js            # Axios configuration with JWT headers
    │   ├── App.css               # Visual resets
    │   ├── App.jsx               # Application routes tree mapping
    │   ├── index.css             # Tailwind v4 import and styles theme
    │   └── main.jsx              # DOM rendering mount
    ├── index.html                # App root page with SEO title and tags
    ├── package.json              # Client dependencies
    └── vite.config.js            # Vite configurations mapping Tailwind v4
```

---

## Database Models Schema

### 1. User (`User.js`)
* `username`: String (Unique, required, trimmed, min 3 chars).
* `email`: String (Unique, required, trimmed, validated pattern).
* `password`: String (Required, hashed via bcrypt pre-save, min 6 chars).
* `timestamps`: Automatically added (`createdAt`, `updatedAt`).

### 2. Story (`Story.js`)
* `title`: String (Required, max 100 characters).
* `description`: String (Required, max 500 characters).
* `content`: String (Default empty, compiles approved contribution text blocks).
* `author`: ObjectId (Ref User, required).
* `status`: String (Enum: `ongoing`, `completed`, default `ongoing`).
* `contributors`: Array of ObjectIds (Ref User, tracks approved collaborators).

### 3. Invitation (`Invitation.js`)
* `story`: ObjectId (Ref Story, required).
* `inviter`: ObjectId (Ref User, required - story author).
* `invitee`: ObjectId (Ref User, required - collaborator).
* `status`: String (Enum: `pending`, `accepted`, `rejected`, default `pending`).
* **Compound Index**: Ensure a unique pair of `story` + `invitee` to prevent duplicate pending requests.

### 4. Contribution (`Contribution.js`)
* `story`: ObjectId (Ref Story, required).
* `contributor`: ObjectId (Ref User, required).
* `content`: String (Required text block chunk).
* `status`: String (Enum: `pending`, `approved`, `rejected`, default `pending`).
* `feedback`: String (Optional feedback message left by the reviewer).

---

## API Documentation

All routes require a valid JWT token passed in the header as:
`Authorization: Bearer <JWT_TOKEN>` (except `/api/auth/register` and `/api/auth/login`).

### Auth API (`/api/auth`)
* `POST /register`: Registers a new user. Returns user data & JWT.
* `POST /login`: Validates password. Returns user data & JWT.
* `GET /me` (Protected): Retrieves current profile info.
* `GET /users?search=name` (Protected): Searches database for users by name or email.

### Stories API (`/api/stories`)
* `POST /` (Protected): Creates a new story.
* `GET /` (Protected): Fetches all stories.
* `GET /my-stories` (Protected): Fetches stories authored or contributed to by the user.
* `GET /:id` (Protected): Fetches detailed story by ID.
* `PUT /:id` (Protected): Updates title or description (Only author, only if ongoing).
* `PATCH /:id/complete` (Protected): Locks story, marks read-only (Only author).
* `GET /:id/export` (Protected): Downloads compiled story as PDF.

### Invitations API (`/api/invitations`)
* `POST /` (Protected): Sends a story invitation to a user (Only author).
* `PATCH /:id` (Protected): Accepts or declines an invitation (Only invitee).
* `GET /my-invitations` (Protected): Retrieves invitations received by the current user.
* `GET /story/:storyId` (Protected): Retrieves all invitations sent for a story (Only author).

### Contributions API (`/api/contributions`)
* `POST /` (Protected): Submits a section draft (Only author or accepted contributors, only if ongoing).
* `PATCH /:id/review` (Protected): Reviews, approves or rejects a section draft (Only author). Appends content on approval.
* `GET /my-contributions` (Protected): Gets contributions submitted by the current user.
* `GET /story/:storyId` (Protected): Gets contributions submitted for a story (Only author/contributors).

---

## Setup & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher.
* **npm**: v9.0.0 or higher.
* **MongoDB**: A running local MongoDB community database instance, or a MongoDB Atlas URI string.

---

### Backend Configuration

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. The `.env` file has already been configured with MongoDB Atlas:
   * `PORT=5001`
   * `MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/scribblecollab?retryWrites=true&w=majority`
   * `JWT_SECRET=supersecretkey123456`
   * `FRONTEND_URL=http://localhost:5173`
   * `EMAIL_USER=your_email@gmail.com`
   * `EMAIL_PASS=your_gmail_app_password`

3. **Email Notification Setup**:
   To receive real-time email notifications for collaborator invitations, reviews, and completed stories:
   * **EMAIL_USER**: Enter your sender email address (e.g., `your_address@gmail.com`).
   * **EMAIL_PASS**: Enter your email App Password. If using Gmail, go to Google Account -> Security -> 2-Step Verification -> App Passwords, generate a new passcode for "ScribbleCollab", and insert the 16-character key.
   * *Note*: If `EMAIL_USER` or `EMAIL_PASS` are left unconfigured, the application will default to **Email Simulation Mode**, printing the generated notification details straight to the backend terminal console logs.

4. Run the development server (runs with nodemon):
   ```bash
   npm run dev
   ```

---

### Frontend Configuration

1. In a separate terminal session, navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. The package.json dependencies and configurations for Vite and Tailwind CSS v4 are ready.
3. Launch the local client server:
   ```bash
   npm run dev
   ```
4. The client will open on `http://localhost:5173`.

---

## Key Implementation Highlights

1. **Tailwind CSS v4 Integration**: Utilizes the native CSS import system (`@import "tailwindcss"`) and Vite plugin (`@tailwindcss/vite`), defining customization tokens inside the `@theme` block.
2. **Dynamic Section Appending**: Upon contribution approval, the backend automatically appends the draft chunk to the main Story content body with double newline spacing, maintaining continuity.
3. **Completed Locking Mechanism**: Marking a story as `completed` updates its model status and locks it. Frontend protected views disable textareas, review panels, and invitation fields, making it read-only.
4. **Secure Streamed PDF Export**: Uses `PDFKit` on the backend to dynamically compile titles, author, contributor arrays, and formatted paragraphs, streaming them to the client with authorization checks.
