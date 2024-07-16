import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const useAuth = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.email; // Adjust this to any required field in your user object
}

const ProtectedRoutes = () => {
    const isAuth = useAuth();
    return isAuth ? <Outlet /> : <Navigate to="/signin" />;
}

export default ProtectedRoutes;
