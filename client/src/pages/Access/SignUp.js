import React, { useState } from 'react';
import axios from 'axios';
import { useFormik } from 'formik';
import { signupSchema } from '../../schemas';
import Input from '../../components/Input/Input';
import { Link, useNavigate } from 'react-router-dom';
import HeaderComp from '../../components/Header/Header';
import './Access.css';

export function SignUp() {
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (values) => {
        const { confirmPassword, firstName, lastName, ...signupValues } = values;
        const names = { firstName, lastName };
        try {
            const response = await axios.post('http://localhost:3001/users', { ...signupValues, names });
            console.log('User signed up successfully:', response.data);
            navigate('/');
        } catch (error) {
            console.error('Error signing up user:', error);
            setErrorMessage(error.response.data.message); // Set error message from the backend
        }
    };
    const { values, errors, touched, handleBlur, handleChange, handleSubmit } = useFormik({
        initialValues: {
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationSchema: signupSchema,
        onSubmit,
    });

    return (
        <>
            <HeaderComp />
            <div className='container'>
                <div className='form-container'>
                    <form onSubmit={handleSubmit} className='form'>
                        <div className='access-heading'>
                            <h1 className='access-heading-1'>Ready to go all in?</h1>
                            <h1 className='access-heading-2'>Create your allin. account</h1>
                        </div>
                        <div className='form-user-names'>
                            <Input
                                label="First Name"
                                type="text"
                                value={values.firstName}
                                onChange={handleChange}
                                id="firstName"
                                placeholder='Enter your first name'
                                onBlur={handleBlur}
                                error={errors.firstName}
                                touched={touched.firstName}
                            />

                            <Input
                                label="Last Name"
                                type="text"
                                value={values.lastName}
                                onChange={handleChange}
                                id="lastName"
                                placeholder='Enter your last name'
                                onBlur={handleBlur}
                                error={errors.lastName}
                                touched={touched.lastName}
                            />
                        </div>

                        <Input
                            name='username'
                            type='text'
                            label='Username'
                            placeholder='Enter your username'
                            value={values.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.username}
                            touched={touched.username}
                        />

                        <Input
                            name='email'
                            type='email'
                            label='Email'
                            placeholder='Enter your email'
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.email}
                            touched={touched.email}
                        />

                        <Input
                            name='password'
                            type='password'
                            label='Password'
                            placeholder='Enter your password'
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.password}
                            touched={touched.password}
                        />

                        <Input
                            name='confirmPassword'
                            type='password'
                            label='Confirm Password'
                            placeholder='Confirm your password'
                            value={values.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.confirmPassword}
                            touched={touched.confirmPassword}
                        />

                        {errorMessage && <div className='submit-error'>{errorMessage}</div>}

                        <div className='buttons'>
                            <button className="submit" type='submit'>Sign Up</button>
                            <button className="cancel" type='button' onClick={() => { navigate('/') }}>Cancel</button>
                            <div className='form-change'>
                                <span>Already have an account? <Link to="/signin" style={{ color: "black" }}>Sign in</Link></span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
