import React from 'react';
import './stylesheets/Input.css'

const Input = ({ name, type, placeholder, onChange, value, label, error, touched, ...rest }) => {
    return (
        <div className='input-container'>
            <label htmlFor={name} className='input-label'>{label}</label>
            <input
                autoComplete='off'
                className='input'
                type={type}
                name={name}
                id={name}
                placeholder={placeholder}
                onChange={onChange}
                value={value}
                {...rest}
            />
            {error && touched && <span className='error'>{error}</span>}

        </div>

    );
};

export default Input;