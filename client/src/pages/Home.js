import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderComp from '../components/Header';
import heroImage from '../assets/hero_image.png'; // Ensure the path to your image is correct
import './stylesheets/Home.css'

export function Home() {
    const navigate = useNavigate();

    return (
        <>
            <HeaderComp />
            <div className='home'>
                <div className='hero'>
                    <div className='hero-text'>
                        <p className='hero-main'>Host, manage, and track all your IRL poker games</p>
                        <p className='hero-secondary'>Manage your real-life poker games with ease. Designed by Edaad Azman.</p>
                        <button className='cta' onClick={() => { navigate('/signup') }}>Get Started</button>
                    </div>
                    <img src={heroImage} alt='Friends playing poker' className='hero-img' />
                </div>
            </div >
        </>
    );
}
