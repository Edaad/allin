import React from "react";
import "./PlayersList.css";
import Profile from "../Profile/Profile";
import InvitePlayers from "../InvitePlayers/InvitePlayers";

/**
 * Displays and manages players for a game
 */
const PlayersList = ({
    players,
    editing,
    isHost,
    user,
    gameId,
    fetchPlayers,
    game,
    joinRequests,
    handleAcceptRequest,
    openRejectModal,
    isLoadingRequests,
}) => {
    if (!players) return null;

    const acceptedPlayers = players.filter(
        (player) => player.invitation_status === "accepted"
    );
    const pendingPlayers = players.filter(
        (player) => player.invitation_status === "pending"
    );
    const waitlistedPlayers = players
        .filter((player) => player.invitation_status === "waitlist")
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return (
        <div className="players-list-component">
            <div className="game-summary-header">
                <h2>Players</h2>
            </div>
            {editing ? (
                isHost ? (
                    <InvitePlayers
                        user={user}
                        gameId={gameId}
                        players={players}
                        fetchPlayers={fetchPlayers}
                    />
                ) : (
                    <div>You are not authorized to edit players.</div>
                )
            ) : (
                <div className="players-list">
                    {acceptedPlayers.length > 0 ? (
                        <div className="all-profiles-container">
                            {acceptedPlayers.map((player) => (
                                <Profile
                                    key={player._id}
                                    data={player.user_id}
                                    size={"compact"}
                                    currentUser={user}
                                    hideFriendActions={true} // Add this prop to hide friend actions
                                />
                            ))}
                        </div>
                    ) : (
                        <div>No accepted players</div>
                    )}

                    {pendingPlayers.length > 0 && (
                        <>
                            <h3>Pending Invitations</h3>
                            <div className="all-profiles-container">
                                {pendingPlayers.map((player) => (
                                    <Profile
                                        key={player._id}
                                        data={player.user_id}
                                        size={"compact"}
                                        currentUser={user}
                                        hideFriendActions={true} // Add this prop to hide friend actions
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {waitlistedPlayers.length > 0 && (
                        <>
                            <h3>Waitlist</h3>
                            <div className="all-profiles-container">
                                {waitlistedPlayers.map((player, index) => (
                                    <div key={player._id} className="waitlist-player">
                                        <span className="waitlist-position">#{index + 1}</span>
                                        <Profile
                                            data={player.user_id}
                                            size="compact"
                                            currentUser={user}
                                            hideFriendActions={true} // Add this prop to hide friend actions
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {isHost && game && game.is_public && (
                        <div className="join-requests-section">
                            <h3>
                                Join Requests{" "}
                                {isLoadingRequests && (
                                    <span className="loading-indicator">Loading...</span>
                                )}
                            </h3>
                            {joinRequests && joinRequests.length > 0 ? (
                                <ul className="join-requests-list">
                                    {joinRequests.map((request) => (
                                        <li key={request._id} className="join-request-item">
                                            <div className="join-request-profile">
                                                <Profile
                                                    data={request.user_id}
                                                    size="compact"
                                                    currentUser={user}
                                                    hideFriendActions={true} // Add this prop to hide friend actions
                                                />
                                                <div className="join-request-actions">
                                                    <button
                                                        className="accept-button small"
                                                        onClick={() =>
                                                            handleAcceptRequest(request.user_id._id)
                                                        }
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        className="decline-button small"
                                                        onClick={() => openRejectModal(request.user_id._id)}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="no-requests-message">No pending join requests</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayersList;