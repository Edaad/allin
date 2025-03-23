import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from './pages/Home/Home';
import { SignUp } from './pages/Access/SignUp';
import { SignIn } from './pages/Access/SignIn';
import { Overview } from './pages/Dashboard/Overview/Overview';
import { Community } from './pages/Dashboard/Community/Community';
import ProtectedRoutes from './utils/ProtectedRoutes';
import { Host } from './pages/Dashboard/Host/Host';
import { Bankroll } from './pages/Dashboard/Bankroll/Bankroll';
import { Games } from './pages/Dashboard/Games/Games';
import { Account } from './pages/Dashboard/Account/Account';
import { GameDashboard } from './pages/Dashboard/GameDashboard/GameDashboard';
import { GroupDashboard } from './pages/Dashboard/GroupDashboard/GroupDashboard';
import NotificationsPage from './pages/Dashboard/Notifications/NotificationsPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoutes />}>
            {/* User Dashboard Routes */}
            <Route path="/dashboard/:userId/account" element={<Account />} />
            <Route path="/dashboard/:userId/overview" element={<Overview />} />
            <Route path="/dashboard/:userId/games" element={<Games />} />
            <Route path="/dashboard/:userId/games/game/:gameId" element={<GameDashboard />} />
            <Route path="/dashboard/:userId/host" element={<Host />} />
            <Route path="/dashboard/:userId/host/game/:gameId" element={<GameDashboard />} />
            <Route path="/dashboard/:userId/host/game/:gameId/edit" element={<GameDashboard />} />
            <Route path="/dashboard/:userId/community" element={<Community />} />
            <Route path="/dashboard/:userId/bankroll" element={<Bankroll />} />
            <Route path="/dashboard/:userId/groups/:groupId" element={<GroupDashboard />} />
            <Route path="/dashboard/:userId/notifications" element={<NotificationsPage />} />
            {/* Add other specific routes here if needed */}
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
