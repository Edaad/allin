import React, { useState } from 'react';
import axios from 'axios';
import './GuestProfileForm.css';

const GuestProfileForm = ({ gameId, onSuccess, onError, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Log the data being sent
        console.log('Submitting form data:', {
            ...formData,
            gameId
        });

        try {
            // Fix: Use the correct API endpoint path that matches the server route
            const url = `${process.env.REACT_APP_API_URL}/guest/join-game`;
            console.log('Making request to:', url);

            const response = await axios.post(url, {
                ...formData,
                gameId
            });

            console.log('Server response:', response.data);

            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (error) {
            console.error('Full error object:', error);
            console.error('Error response:', error.response);
            console.error('Error request:', error.request);
            console.error('Error config:', error.config);

            let errorMessage;
            if (error.response) {
                // The server responded with a status code outside of 2xx
                errorMessage = error.response.data?.message || 'Server error occurred';
                console.error('Server error status:', error.response.status);
                console.error('Server error data:', error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = 'No response received from server';
                console.error('No response received:', error.request);
            } else {
                // Something happened in setting up the request
                errorMessage = 'Error setting up request';
                console.error('Request setup error:', error.message);
            }

            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="guest-profile-form">
            <div className="guest-profile-header">
                <h2>Join Game as Guest</h2>
                {onClose && (
                    <button className="close-button" onClick={onClose}>×</button>
                )}
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        pattern="[0-9]*"
                        minLength="10"
                        maxLength="15"
                        placeholder="Enter your phone number"
                    />
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Joining...' : 'Join Game'}
                </button>
            </form>
        </div>
    );
};

export default GuestProfileForm;