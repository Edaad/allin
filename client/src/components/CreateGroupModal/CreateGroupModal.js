// src/components/CreateGroupModal/CreateGroupModal.js
import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import axios from 'axios';
import './CreateGroupModal.css';
import Input from '../Input/Input';

function CreateGroupModal({ open, onClose, user, onGroupCreated }) {
    const [groupData, setGroupData] = useState({
        group_name: '',
        description: '',
        profile_image: '',
        banner_image: '',
        is_public: false
    });

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGroupData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePrivacyChange = (isPublic) => {
        setGroupData(prev => ({
            ...prev,
            is_public: isPublic
        }));
    };

    const handleSubmit = async () => {
        // Basic validation
        if (!groupData.group_name.trim()) {
            setError('Group name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/groups`, {
                admin_id: user._id,
                ...groupData
            });

            if (onGroupCreated) {
                onGroupCreated(response.data);
            }

            onClose();
        } catch (error) {
            console.error('Error creating group:', error);
            setError(error.response?.data?.message || 'Failed to create group');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 500,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                fontFamily: 'Outfit, sans-serif',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                <h2 className="create-group-heading">Create a New Group</h2>

                {error && <div className="create-group-error">{error}</div>}

                <Input
                    name="group_name"
                    type="text"
                    label="Group Name"
                    placeholder="Enter a name for your group"
                    value={groupData.group_name}
                    onChange={handleInputChange}
                />

                <div className="textarea-container">
                    <label htmlFor="description" className="input-label">Description</label>
                    <textarea
                        name="description"
                        id="description"
                        rows="4"
                        value={groupData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your group..."
                    />
                </div>

                <Input
                    name="profile_image"
                    type="text"
                    label="Profile Image URL (optional)"
                    placeholder="Enter an image URL"
                    value={groupData.profile_image}
                    onChange={handleInputChange}
                />

                <Input
                    name="banner_image"
                    type="text"
                    label="Banner Image URL (optional)"
                    placeholder="Enter an image URL"
                    value={groupData.banner_image}
                    onChange={handleInputChange}
                />

                <div className="group-privacy-option">
                    <label className="input-label">Group Privacy</label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="is_public"
                                checked={!groupData.is_public}
                                onChange={() => handlePrivacyChange(false)}
                            />
                            Private (invite only)
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="is_public"
                                checked={groupData.is_public}
                                onChange={() => handlePrivacyChange(true)}
                            />
                            Public (open to join requests)
                        </label>
                    </div>
                </div>

                <div className="create-group-actions">
                    <button
                        className="create-button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Group'}
                    </button>
                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                </div>
            </Box>
        </Modal>
    );
}

export default CreateGroupModal;