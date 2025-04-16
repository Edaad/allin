import React from "react";
import "./GameDetails.css";
import Input from "../Input/Input";
import Select from "../Select/Select";

/**
 * Displays and allows editing of game details
 */
const GameDetails = ({
    game,
    gameForm,
    handleInputChange,
    editing,
    isHost,
    selectedGroup,
    setGameForm,
    handleShareLink,
    showShareModal,
    formattedDate,
    formattedTime,
}) => {
    if (!game) return null;

    return (
        <div className="game-details-component">
            <div className="game-summary-header">
                <h2>Game Details</h2>
                {game.is_public && (
                    <button className="share-link" onClick={handleShareLink}>
                        Share Game Link
                    </button>
                )}
            </div>

            {showShareModal && (
                <div className="share-modal">Link copied to clipboard!</div>
            )}

            {editing ? (
                <form className="host-form compact">
                    <Input
                        name="name"
                        type="text"
                        label="Name"
                        placeholder="Give your game a name"
                        value={gameForm.name}
                        onChange={handleInputChange}
                    />
                    <div className="input-double">
                        <Select
                            name="blinds"
                            label="Blinds"
                            placeholder="Select your game blinds"
                            value={gameForm.blinds}
                            onChange={handleInputChange}
                            options={[
                                { value: "1/2", label: "$1/$2" },
                                { value: "2/5", label: "$2/$5" },
                                { value: "5/10", label: "$5/$10" },
                            ]}
                        />
                        <Select
                            name="handed"
                            label="Handed"
                            placeholder="Select the player max"
                            value={gameForm.handed}
                            onChange={handleInputChange}
                            options={[
                                { value: "2", label: "2 max" },
                                { value: "3", label: "3 max" },
                                { value: "4", label: "4 max" },
                                { value: "5", label: "5 max" },
                                { value: "6", label: "6 max" },
                                { value: "7", label: "7 max" },
                                { value: "8", label: "8 max" },
                                { value: "9", label: "9 max" },
                                { value: "10", label: "10 max" },
                            ]}
                        />
                    </div>
                    <div className="game-privacy-option">
                        <label className="input-label">
                            Game Privacy
                            {selectedGroup && (
                                <span className="privacy-locked-note">
                                    (Locked to match group privacy)
                                </span>
                            )}
                        </label>
                        <div className="radio-group">
                            <label
                                className={`radio-label ${selectedGroup ? "disabled" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="isPublic"
                                    value="false"
                                    checked={!gameForm.isPublic}
                                    onChange={() => {
                                        if (!selectedGroup) {
                                            setGameForm({
                                                ...gameForm,
                                                isPublic: false,
                                            });
                                        }
                                    }}
                                    disabled={selectedGroup !== null}
                                />
                                Private (invite only)
                            </label>
                            <label
                                className={`radio-label ${selectedGroup ? "disabled" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="isPublic"
                                    value="true"
                                    checked={gameForm.isPublic}
                                    onChange={() => {
                                        if (!selectedGroup) {
                                            setGameForm({
                                                ...gameForm,
                                                isPublic: true,
                                            });
                                        }
                                    }}
                                    disabled={selectedGroup !== null}
                                />
                                Public (open to join requests)
                            </label>
                        </div>
                    </div>
                    <Input
                        name="location"
                        type="text"
                        label="Location"
                        placeholder="Enter the address of your game"
                        value={gameForm.location}
                        onChange={handleInputChange}
                    />
                    <div className="input-double">
                        <Input
                            name="date"
                            type="date"
                            label="Date"
                            value={gameForm.date}
                            onChange={handleInputChange}
                        />
                        <Input
                            name="time"
                            type="time"
                            label="Time"
                            value={gameForm.time}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="textarea-container">
                        <label htmlFor="notes" className="input-label">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            id="notes"
                            rows="5"
                            value={gameForm.notes}
                            onChange={handleInputChange}
                            placeholder="Enter any additional notes about the game..."
                        />
                    </div>
                </form>
            ) : (
                <div className="game-details">
                    <div className="detail-item">
                        <span className="detail-label">Game Type: </span>
                        <span className="detail-value">
                            <span className="icon-wrapper">
                                <i className="fa-solid fa-gamepad"></i>
                            </span>
                            {game.is_public
                                ? "Public (open to join requests)"
                                : "Private (invite only)"}
                        </span>
                    </div>

                    {isHost && (
                        <div className="detail-item">
                            <span className="detail-label">Handed: </span>
                            <span className="detail-value">
                                <span className="icon-wrapper">
                                    <i className="fa-solid fa-users"></i>
                                </span>
                                {game.handed} max
                            </span>
                        </div>
                    )}

                    <div className="detail-item">
                        <span className="detail-label">Blinds: </span>
                        <span className="detail-value">
                            <span className="icon-wrapper">
                                <i className="fa-solid fa-dollar-sign"></i>
                            </span>
                            {game.blinds}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Location: </span>
                        <span className="detail-value">
                            <span className="icon-wrapper">
                                <i className="fa-solid fa-location-dot"></i>
                            </span>
                            {game.location}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Date: </span>
                        <span className="detail-value">
                            <span className="icon-wrapper">
                                <i className="fa-solid fa-calendar"></i>
                            </span>
                            {formattedDate}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Time: </span>
                        <span className="detail-value">
                            <span className="icon-wrapper">
                                <i className="fa-solid fa-clock"></i>
                            </span>
                            {formattedTime}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-label">Notes: </span>
                        <span className="detail-value">
                            <span className="icon-wrapper">
                                <i className="fa-solid fa-note-sticky"></i>
                            </span>
                            <span className="notes-value">
                                {game.notes || "No notes provided"}
                            </span>
                        </span>
                    </div>

                    {game.group_id && (
                        <div className="detail-item">
                            <span className="detail-label">Group: </span>
                            <span className="detail-value">
                                <span className="icon-wrapper">
                                    <i className="fa-solid fa-users-rectangle"></i>
                                </span>
                                {game.group_id.group_name}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameDetails;