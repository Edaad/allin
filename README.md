# All In - MERN Application

All In is a full-stack MERN application that lets users sign in, manage their profiles, and participate in game communities. The backend is deployed on Railway, the database is hosted on MongoDB Atlas, and the frontend is deployed on Firebase Hosting.

## Features
- **User Authentication:** Sign in and sign up flows.
- **Dashboard:** Multiple sections including Overview, Games, Host, Community, and Bankroll.
- **Game Management:** Create, update, and delete game sessions.
- **Invitations:** Invite friends and manage game invitations.
- **Real-Time Updates:** Efficient data fetching with debouncing and state management.

## Project Structure

### Client Structure
The client is organized with React components and pages:

- **Components:** Reusable UI elements
  - `Accordion`: Expandable content sections
  - `GameCard`: UI component for displaying game information
  - `GroupCard`: UI component for displaying group information
  - `Input`: Custom input component
  - `Profile`: User profile display component
  - `Sidebar`: Navigation sidebar
  - `Table`: Data table component

- **Pages:**
  - `Dashboard/`: Main user interface after login
    - `Account/`: User account settings
    - `Community/`: Social features and groups
    - `Games/`: Game discovery and management
    - `Profile/`: Profile management and customization

### Server Structure
The server follows an MVC-like architecture:

- **Models:** MongoDB schemas
  - `profile.js`: User profile data
  - `game.js`: Game session details
  - `player.js`: Game participation records
  - `notification.js`: User notifications

- **Controllers:** Business logic
  - `profileController.js`: Profile management
  - `gameController.js`: Game CRUD operations
  - `playerController.js`: Player invitation and management
  - `notificationController.js`: Notification handling

- **Routes:** API endpoints
  - `profileRoutes.js`: Profile-related endpoints
  - `gameRoutes.js`: Game-related endpoints
  - `playerRoutes.js`: Player-related endpoints

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
    ```
2. Navigate to the project directory:
   ```bash
   cd allin
   ```

4. Navigate to the server directory:
    ```bash
    cd server
    ```

5. Install the dependencies:
    ```bash
    npm install
    ```

6. Create a `.env` file in the `server` directory and add the following environment variables:
    ```env
    MONGO_URI=your-mongodb-uri
    PORT=3001
    NODE_ENV=development
    ```

7. Start the backend server:
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

### Troubleshooting
- If you get a CORS error, make sure your backend allows requests from localhost:3000.
- Double-check your .env files are placed in the correct folders (server and client respectively).
- If ports 3000 or 3001 are in use, you can change them in the .env files and React config.

