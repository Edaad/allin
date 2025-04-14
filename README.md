# All In - MERN Application

All In is a full-stack MERN application that lets users sign in, manage their profiles, and participate in game communities. The backend is deployed on Railway, the database is hosted on MongoDB Atlas, and the frontend is deployed on Firebase Hosting.

## Features
- **User Authentication:** Sign in and sign up flows.
- **Dashboard:** Multiple sections including Overview, Games, Host, Community, and Bankroll.
- **Game Management:** Create, update, and delete game sessions.
- **Invitations:** Invite friends and manage game invitations.
- **Real-Time Updates:** Efficient data fetching with debouncing and state management.

## Tech Stack
- **Frontend:** React, Create React App, Axios, Firebase Hosting
- **Backend:** Node.js, Express, Railway for deployment
- **Database:** MongoDB Atlas
- **CI/CD:** GitHub Actions

## Access
Link: https://all-in-4ce60.web.app/

## Demo
https://github.com/user-attachments/assets/e23376f4-d770-448f-8fa1-64c74088dbef

## Running the Application Locally

### Prerequisites
- Node.js and npm installed
- MongoDB Atlas account and cluster set up

### Backend Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/allin.git
    cd allin
    ```

2. Navigate to the server directory:
    ```bash
    cd server
    ```

3. Install the dependencies:
    ```bash
    npm install
    ```

4. Create a `.env` file in the `server` directory and add the following environment variables:
    ```env
    MONGODB_URI=your-mongodb-uri
    PORT=3001
    NODE_ENV=development
    ```

5. Start the backend server:
    ```bash
    npm start
    ```

### Frontend Setup
1. Navigate to the client directory:
    ```bash
    cd ../client
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the `client` directory and add the following environment variables:
    ```env
    REACT_APP_API_URL=http://localhost:3001
    ```

4. Start the frontend development server:
    ```bash
    npm start
    ```

### Accessing the Application
- Open your browser and navigate to `http://localhost:3000` to access the frontend.
- The backend server will be running on `http://localhost:3001`.
