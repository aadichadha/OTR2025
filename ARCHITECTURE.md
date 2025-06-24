# Baseball Performance Analytics Platform - Granular MVP Build Plan

## Architecture Overview

### Tech Stack
- **Frontend**: React with Vite (fast, modern)
- **Backend**: Node.js/Express 
- **Database**: PostgreSQL
- **File Storage**: Local filesystem (MVP) → AWS S3 (later)
- **Auth**: JWT tokens
- **Email**: Nodemailer with Gmail (MVP) → SendGrid (later)
- **PDF**: PDFKit (Node.js)
- **Deployment**: Local → Docker → Cloud (progressive)

## Folder Structure

```
baseball-analytics/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── upload/
│   │   │   │   ├── CSVUploader.jsx
│   │   │   │   └── FileValidator.jsx
│   │   │   ├── reports/
│   │   │   │   ├── ReportViewer.jsx
│   │   │   │   ├── ReportHistory.jsx
│   │   │   │   └── MetricsDisplay.jsx
│   │   │   ├── player/
│   │   │   │   ├── PlayerProfile.jsx
│   │   │   │   └── PlayerList.jsx
│   │   │   └── common/
│   │   │       ├── Header.jsx
│   │   │       ├── Navigation.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Players.jsx
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   └── reports.js
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   └── validators.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── uploadController.js
│   │   │   ├── reportController.js
│   │   │   └── playerController.js
│   │   ├── services/
│   │   │   ├── csvParser.js
│   │   │   ├── metricsCalculator.js
│   │   │   ├── reportGenerator.js
│   │   │   ├── pdfService.js
│   │   │   └── emailService.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Player.js
│   │   │   ├── Session.js
│   │   │   └── Report.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   ├── reports.js
│   │   │   └── players.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── benchmarks.js
│   │   │   └── constants.js
│   │   ├── utils/
│   │   │   ├── calculations.js
│   │   │   └── formatters.js
│   │   └── app.js
│   ├── uploads/ (temp storage)
│   ├── reports/ (generated PDFs)
│   └── package.json
│
├── database/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_players.sql
│   │   ├── 003_create_sessions.sql
│   │   └── 004_create_reports.sql
│   └── seeds/
│       └── benchmarks.sql
│
└── docker-compose.yml
``` 