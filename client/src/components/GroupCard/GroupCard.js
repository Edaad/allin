// src/components/GroupCard/GroupCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GroupCard.css';

function GroupCard({ group, user }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/dashboard/${user._id}/groups/${group._id}`);
    };

    // Default image if none provided
    const profileImage = group.profile_image || '/default-group.png';

    return (
        <div className="group-card" onClick={handleClick}>
            <div className="group-card-header">
                <div className="group-card-image">
                    <img src={profileImage} alt={group.group_name} />
                </div>
                <div className="group-card-title-container">
                    <h3 className="group-card-title">{group.group_name}</h3>
                    {group.is_public && <span className="public-tag">Public</span>}
                </div>
            </div>
            <div className="group-card-admin">
                Admin: {group.admin_id.username}
            </div>
            <div className="group-card-description">
                {group.description ? (
                    group.description.length > 100
                        ? `${group.description.substring(0, 100)}...`
                        : group.description
                ) : 'No description available'}
            </div>
            {group.membershipStatus && (
                <div className={`group-card-status status-${group.membershipStatus}`}>
                    {group.membershipStatus === 'accepted' && 'Member'}
                    {group.membershipStatus === 'pending' && 'Invitation Received'}
                    {group.membershipStatus === 'requested' && 'Request Pending'}
                    {group.membershipStatus === 'rejected' && 'Request Rejected'}
                </div>
            )}
        </div>
    );
}

export default GroupCard;