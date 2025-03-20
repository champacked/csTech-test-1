# Machine Test for MERN Stack Developer 

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Create `.env` in backend folder:
```
PORT=2000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

3. Install dependencies:
```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

4. Start the servers:
```bash
# Start backend (from backend directory)
npm start

# Start frontend (from frontend directory)
npm run dev
```

5. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:2000

## Features

- User authentication (register/login)
- CSV/Excel file upload
- Automatic contact distribution
- Agent management
- Real-time list updates
