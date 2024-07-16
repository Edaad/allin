import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './stylesheets/Sidebar.css'

const Sidebar = ({ menus, setPage, page }) => {
    const navigate = useNavigate()

    const signOut = () => {
        localStorage.removeItem('user');
        navigate('/signin');
    };

    return (
        <div className='sidebar-container'>
            <ul className="menu">
                {menus.map((Menu, index) => (
                    <li
                        key={index}
                        className={`menu-item ${page === Menu.title ? "bg-highlight" : ""}`}
                        onClick={() => setPage(Menu.page)}
                    >
                        <span className='title' >{Menu.title}</span>
                    </li>
                ))}
            </ul>
            <button className="signout-button" onClick={signOut}>Sign Out</button>
        </div>
    );

};

export default Sidebar;
