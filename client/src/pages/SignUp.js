import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeaderComp from '../components/Header';
import Input from '../components/Input';
import axios from 'axios';
import './stylesheets/Access.css'

export function SignUp() {
    const navigate = useNavigate();
    const [user, setUser] = useState({ name: '', username: '', email: '', password: '' });

    const signupHandler = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post('http://localhost:3001/users', user);
            console.log('User signed up successfully:', response.data);
        } catch (error) {
            console.error('Error signing up user:', error);
        }

        navigate('/')
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
                    <form onSubmit={signupHandler} className='form'>
                        <div className='access-heading'>
                            <h1 className='access-heading-1'>Ready to go all in?</h1>
                            <h1 className='access-heading-2'>Create your allin. account</h1>
                        </div>
                        <Input
                            name='name'
                            type='text'
                            label='Name'
                            placeholder='Enter your full name'
                            onChange={onChangeHandler}
                        />

                        <Input
                            name='username'
                            type='text'
                            label='Username'
                            placeholder='Enter your username'
                            onChange={onChangeHandler}
                        />

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

                        <div className='buttons'>
                            <button className="submit" type='submit'>Sign Up</button>
                            <button className="cancel" type='button' onClick={() => { navigate('/') }}>Cancel</button>
                            <div className='form-change'>
                                <span>Already have an account? <Link to="/signin">Sign in</Link></span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
