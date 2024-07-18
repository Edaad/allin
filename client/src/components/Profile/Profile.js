import React, { useMemo } from "react";
import './Profile.css';
import { minidenticon } from 'minidenticons';

const Profile = ({ data }) => {
    if (!data || !data.username) {
        return null;
    }

    const MinidenticonImg = ({ username, saturation, lightness, ...props }) => {
        const svgURI = useMemo(
            () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username, saturation, lightness)),
            [username, saturation, lightness]
        )
        return (<img src={svgURI} alt={username} {...props} />)
    }

    return (
        <div className="profile-container">
            <MinidenticonImg className="profile-picture" username={data.username} />
            <div className="profile-details-wrapper">
                <div className="profile-details-container">
                    <span className="profile-username">{data.username}</span>
                    <span className="profile-name">{data.names.firstName} {data.names.lastName}</span>
                    <span className="profile-email">{data.email}</span>
                </div>
                <button className="add-button">+ Add Friend</button>
            </div>
        </div>
    );
};

export default Profile;
