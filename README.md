# Art Commission System

A comprehensive web application for managing art commissions, allowing artists to showcase their work, receive commission requests, and clients to track their commission progress.

## Features

- **Public Commission Queue**: Kanban-style view of all commissions in the workflow
- **User Authentication**: Login system for clients to manage their commissions
- **Commission Request Form**: Detailed form for requesting custom artwork
- **Dynamic Pricing Calculator**: Calculate commission prices based on options selected
- **Commission Details**: View detailed information about commissions with updates
- **User Profiles**: Personal profile pages for users to view their commissions
- **NSFW Content Protection**: Restricted access to NSFW content for logged-in users only

## Technology Stack

### Backend
- Node.js with Express
- MS SQL Server database
- JWT for authentication
- Nodemailer for email notifications
- Multer for file uploads

### Frontend
- React.js with React Router
- Material UI component library
- Axios for API requests
- JWT token for auth management

## Installation

### Prerequisites
- Node.js (v14+)
- MS SQL Server

### Setup Database
1. Create a new SQL Server database
2. Run the SQL script in `backend/database/schema.sql` to create the database schema

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd art-commission-system/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=ArtCommissionSystem
   DB_SERVER=localhost
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   EMAIL_FROM=your_email@gmail.com
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd art-commission-system/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   REACT_APP_API_URL=http://localhost:3000/api
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Deployment

This application is designed to be hosted on GoDaddy's hosting services. Follow these steps for deployment:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the backend Node.js application using GoDaddy's Node.js hosting
3. Upload the frontend build files to the appropriate web directory
4. Configure the database connection on GoDaddy's MS SQL Server

## Project Structure

```
art-commission-system/
├── backend/
│   ├── database/          # Database schemas and connection
│   ├── middleware/        # Authentication middleware
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── uploads/           # Upload directory for files
│   ├── utils/             # Utility functions
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main server file
├── frontend/
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts (auth)
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   ├── App.js         # Main App component
│   │   ├── index.js       # Entry point
│   │   └── theme.js       # Material UI theme
│   ├── .env               # Environment variables
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation
```

## License

This project is proprietary and not licensed for public use. 