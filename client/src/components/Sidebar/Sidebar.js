import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './Sidebar.css';
import { minidenticon } from 'minidenticons';
// import icon from '../../assets/images/games.png'

const Sidebar = ({ menus, page, username }) => {
    const navigate = useNavigate();
    const { userId } = useParams();

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
                <div className="menu-item" onClick={() => navigate(`/dashboard/${userId}/account`)}><MinidenticonImg className="profile-pic" username={username} /><span className={`account-username ${page === "account" ? "bg-highlight" : ""}`}>{username}</span></div>
                {menus.map((Menu, index) => (
                    <li
                        key={index}
                        className={`menu-item ${page === Menu.page ? "bg-highlight" : ""}`}
                        onClick={() => navigate(`/dashboard/${userId}/${Menu.page}`)}
                    >
                        {/* <img src={icon} alt="Menu Icon" className="menu-item-icon" /> */}
                        <span className='title' >{Menu.title}</span>
                    </li>
                ))}
            </ul>
            <button className="signout-button" onClick={signOut}>Sign Out</button>
        </div>
    );
};

export default Sidebar;
