import React, { useMemo } from "react";
import './Profile.css';
import { minidenticon } from 'minidenticons';

const Profile = ({ data, size }) => {


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
        <>
            <div className={`profile-container${size === "compact" ? "-compact" : ""}`}>
                <MinidenticonImg className={`profile-picture${size === "compact" ? "-compact" : ""}`} username={data.username} />
                <div className={`profile-details-wrapper${size === "compact" ? "-compact" : ""}`}>
                    <div className={`profile-details-container${size === "compact" ? "-compact" : ""}`}>
                        <span className={`profile-username${size === "compact" ? "-compact" : ""}`}>{data.username}</span>
                        <span className={`profile-name${size === "compact" ? "-compact" : ""}`}>{data.names.firstName} {data.names.lastName}</span>
                        <span className={`profile-email${size === "compact" ? "-compact" : ""}`}>{data.email}</span>
                    </div>
                    <button className={`add-button${size === "compact" ? "-compact" : ""}`}>+ Add Friend</button>
                </div>
            </div>
        </>
    );
};

export default Profile;
