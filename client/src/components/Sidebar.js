import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import './stylesheets/Sidebar.css';
import { minidenticon } from 'minidenticons';

const Sidebar = ({ menus, setPage, page, username }) => {
    const navigate = useNavigate()

    const signOut = () => {
        localStorage.removeItem('user');
        navigate('/signin');
    };

    const MinidenticonImg = ({ username, saturation, lightness, ...props }) => {
        const svgURI = useMemo(
            () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username, saturation, lightness)),
            [username, saturation, lightness]
        )
        return (<img src={svgURI} alt={username} {...props} />)
    }

    return (
        <div className='sidebar-container'>
            <ul className="menu">
                <div className="menu-item"><MinidenticonImg className="profile-pic" username={username} /><span>{username}</span></div>
                {menus.map((Menu, index) => (
                    <li
                        key={index}
                        className={`menu-item ${page === Menu.page ? "bg-highlight" : ""}`}
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
