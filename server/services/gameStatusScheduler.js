const cron = require('node-cron');
const { updateGameStatuses } = require('./gameStatusUpdater');

/**
 * Schedules the game status update to run daily at midnight
 */
const scheduleGameStatusUpdates = () => {
    // Run at midnight (00:00) every day
    cron.schedule('0 0 * * *', async () => {
        console.log('Running scheduled game status update...');
        try {
            await updateGameStatuses();
        } catch (error) {
            console.error('Scheduled game status update failed:', error);
        }
    });

    console.log('Game status update scheduler initialized');
};

module.exports = scheduleGameStatusUpdates;