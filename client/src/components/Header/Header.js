import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css'
import Logo from '../Logo/Logo';

const HeaderComp = ({ links }) => {

    const navigate = useNavigate();
    return (
        <header className="header">
            <div className='header-logo'>
                <Logo />
            </div>
            <nav className="nav">
                <ul className="nav-list">
                    {links && links.map((link, index) => (
                        <li key={index} className="nav-item">
                            <a href={link.url} className="nav-link">
                                {link.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className='login-buttons'>
                <button onClick={() => { navigate('/signin') }} className='header-signin-button'>Sign in</button>
                <button onClick={() => { navigate('/signup') }} className='header-signup-button'>Create an account</button>
            </div>
        </header>
    );
};

export default HeaderComp;
