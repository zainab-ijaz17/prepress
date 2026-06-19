# Prepress Approval Portal (MVP)

A web-based portal for managing design jobs, file uploads, customer feedback, and approval workflows.

## Features

- **Job Management**: Create, view, and filter jobs by status
- **File Upload & Versioning**: Upload design files (PDF, JPEG, PNG) with automatic version tracking
- **File Viewer**: View uploaded files directly in the app (no download)
- **Feedback System**: Add comments and feedback on jobs
- **Approval Workflow**: Approve jobs or request changes with status tracking
- **Activity Timeline**: Track all actions on a job
- **Dashboard**: View summary statistics

## Tech Stack

### Backend
- Node.js with Express
- Multer for file uploads
- In-memory data storage (for MVP)

### Frontend
- React with Vite
- React Router for navigation
- Axios for API calls
- Custom CSS styling

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory (in a new terminal):
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. **Create a Job**: Click "Create Job" and fill in the details
3. **Upload Files**: Go to the job detail page and upload a design file
4. **Review**: Mark the job as "Under Review" when ready
5. **Approve or Request Changes**: Use the action buttons to approve or send back for rework
6. **Add Comments**: Provide feedback using the comments section
7. **Track Activity**: View the activity timeline to see all actions

## Job Workflow

```
Created → In Progress → Uploaded → Under Review
        → (Feedback → Rework → Upload again)
        → Approved → Completed
```

## API Endpoints

### Jobs
- `GET /jobs` - Get all jobs (optional ?status filter)
- `POST /jobs` - Create a new job
- `GET /jobs/:id` - Get a specific job
- `PATCH /jobs/:id/status` - Update job status

### Files
- `POST /jobs/:id/upload` - Upload a file for a job
- `GET /jobs/:id/files` - Get all files for a job

### Comments
- `POST /jobs/:id/comments` - Add a comment to a job
- `GET /jobs/:id/comments` - Get all comments for a job

### Activity
- `GET /jobs/:id/activity` - Get activity logs for a job

## File Upload Constraints

- Accepted formats: PDF, JPEG, PNG
- Maximum file size: 10MB
- Files are stored locally in `backend/uploads/`

## Notes

- This is an MVP with in-memory storage. Data will be lost when the server restarts.
- No authentication system (single admin user with full access).
- No SAP integration.
- Files cannot be downloaded; they can only be viewed within the application.

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- User authentication and authorization
- Drag & drop file upload
- Email notifications
- SAP integration
- Advanced filtering and search
