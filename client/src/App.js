import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from './pages/Home';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Overview } from './pages/Overview';
import { Community } from './pages/Community';
import ProtectedRoutes from './utils/ProtectedRoutes';
import { Host } from './pages/Host';
import { Bankroll } from './pages/Bankroll';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/dashboard/:userId/overview" element={<Overview />} />
            <Route path="/dashboard/:userId/host" element={<Host />} />
            <Route path="/dashboard/:userId/community" element={<Community />} />
            <Route path="/dashboard/:userId/bankroll" element={<Bankroll />} />
            {/* You can add other specific routes here if needed */}
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
