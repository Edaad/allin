import React from 'react';
import './Select.css';

const Select = ({ name, placeholder, value, onChange, label, error, touched, options, ...rest }) => {
    return (
        <div className='input-container'>
            <label htmlFor={name} className='input-label'>{label}</label>
            <select
                className={`select ${value ? 'has-value' : ''}`}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                {...rest}
            >
                <option className="select-placeholder" value="" disabled>{placeholder}</option>
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && touched && <span className='error'>{error}</span>}
        </div>
    );
};

export default Select;
