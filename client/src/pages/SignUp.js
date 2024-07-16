import React from 'react';
import axios from 'axios';
import { useFormik } from 'formik';
import { signupSchema } from '../schemas';
import Input from '../components/Input';
import { Link, useNavigate } from 'react-router-dom';
import HeaderComp from '../components/Header';
import './stylesheets/Access.css';

export function SignUp() {
    const navigate = useNavigate();

    const onSubmit = async (values) => {
        const { confirmPassword, ...signupValues } = values; // Exclude confirmPassword
        try {
            const response = await axios.post('http://localhost:3001/users', signupValues);
            console.log('User signed up successfully:', response.data);
            navigate('/');
        } catch (error) {
            console.error('Error signing up user:', error);
        }
    };

    const { values, errors, touched, handleBlur, handleChange, handleSubmit } = useFormik({
        initialValues: {
            name: '',
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
                        <Input
                            name='name'
                            type='text'
                            label='Name'
                            placeholder='Enter your full name'
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.name}
                            touched={touched.name}
                        />

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
