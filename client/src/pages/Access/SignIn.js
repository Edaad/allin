import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/Input/Input';
import axios from 'axios';
import HeaderComp from '../../components/Header/Header';
import './Access.css';

export function SignIn() {
    const navigate = useNavigate();

    const [user, setUser] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const signinHandler = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/signin`, user);
            setSuccess(response.data.message);
            setError('');
            localStorage.removeItem('user'); // Clear any existing user data

            // Extract necessary fields from the response
            const userData = response.data.user;
            
            // Ensure all required fields are present with default values if missing
            const sanitizedUserData = {
                _id: userData._id || '',
                names: userData.names || { firstName: '', lastName: '' },
                username: userData.username || '',
                email: userData.email || '',
                friends: userData.friends || [],
                pendingRequests: userData.pendingRequests || [],
                friendRequests: userData.friendRequests || []
            };
            
            // Store the sanitized user data
            localStorage.setItem('user', JSON.stringify(sanitizedUserData));

            navigate(`/dashboard/${sanitizedUserData._id}/overview`);
        } catch (error) {
            setError(error.response ? error.response.data.message : 'Error signing in');
            setSuccess('');
        }
    };

    const onChangeHandler = (event) => {
        const { name, value } = event.target;

        setUser((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    return (
        <>
            <HeaderComp />
            <div className='container'>
                <div className='form-container'>
                    <form onSubmit={signinHandler} className='form'>
                        <div className='access-heading'>
                            <h1 className='access-heading-1'>Time to go all in.</h1>
                            <h1 className='access-heading-2'>Sign in to your allin. account</h1>
                        </div>
                        {success && <p className='success'>{success}</p>}
                        <Input
                            name='email'
                            type='email'
                            label='Email'
                            placeholder='Enter your email'
                            onChange={onChangeHandler}
                        />

                        <Input
                            name='password'
                            type='password'
                            label='Password'
                            placeholder='Enter your password'
                            onChange={onChangeHandler}
                        />
                        {error && <p className='submit-error'>{error}</p>}


                        <div className='buttons'>
                            <button className="submit" type='submit'>Sign In</button>
                            <button className="cancel" type='button' onClick={() => { navigate('/') }}>Cancel</button>
                            <div className='form-change'>
                                <span>Don't have an account? <Link to="/signup" style={{ color: "black" }}>Sign up</Link></span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
