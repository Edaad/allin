import React from "react";
import "./GamesList.css";
import GameCard from "../GameCard/GameCard";

/**
 * Reusable component to display a list of games with consistent styling
 * @param {Object} props - Component props
 * @param {Array} props.games - Array of game objects to display
 * @param {Object} props.user - Current user object
 * @param {Object} props.waitlistPositions - Object mapping game IDs to waitlist positions
 * @param {Function} props.renderCustomActions - Optional function to render custom actions for a game
 * @param {String} props.emptyMessage - Message to show when no games are available
 * @param {Boolean} props.loading - Whether the games are currently loading
 */
const GamesList = ({
    games = [],
    user,
    waitlistPositions = {},
    renderCustomActions,
    emptyMessage = "No games available",
    loading = false,
}) => {
    if (loading) {
        return <div className="games-list-loading">Loading games...</div>;
    }

    if (!games.length) {
        return <div className="games-list-empty">{emptyMessage}</div>;
    }

    return (
        <div className="games-list-container">
            {games.map((game) => (
                <GameCard
                    key={game._id}
                    game={{
                        ...game,
                        waitlistPosition:
                            game.playerStatus === "waitlist"
                                ? waitlistPositions[game._id]
                                : undefined,
                    }}
                    user={user}
                    customActions={renderCustomActions ? renderCustomActions(game) : null}
                    showBorder={true}
                />
            ))}
        </div>
    );
};

export default GamesList;