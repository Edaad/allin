const Game = require('../models/game');

/**
 * Updates the status of games from "upcoming" to "completed" 
 * when their game date has passed
 */
const updateGameStatuses = async () => {
    try {
        const currentDate = new Date();

        // Find all upcoming games with dates in the past
        const result = await Game.updateMany(
            {
                game_status: 'upcoming',
                game_date: { $lt: currentDate }
            },
            {
                $set: { game_status: 'completed' }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`Updated ${result.modifiedCount} games to completed status`);
        }
        return result;
    } catch (error) {
        console.error('Error updating game statuses:', error);
        throw error;
    }
};

module.exports = {
    updateGameStatuses
};