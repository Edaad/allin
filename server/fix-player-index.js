// Script to fix the MongoDB player index issue
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      const db = mongoose.connection;

      // Drop the problematic index
      console.log('Dropping problematic index on players collection...');
      await db.collection('players').dropIndex('game_id_1_user_id_1');
      console.log('Successfully dropped the problematic index');

      // Create a new, more specific index
      console.log('Creating new index for regular players...');
      await db.collection('players').createIndex(
        { game_id: 1, user_id: 1 },
        { 
          unique: true,
          partialFilterExpression: { 
            is_guest: false,
            user_id: { $type: "objectId" }
          }
        }
      );
      console.log('Successfully created new index for regular players');

      // Create index for guest players
      console.log('Creating index for guest players...');
      await db.collection('players').createIndex(
        { game_id: 1, guest_id: 1 },
        { 
          unique: true,
          partialFilterExpression: { 
            is_guest: true,
            guest_id: { $type: "objectId" }
          }
        }
      );
      console.log('Successfully created index for guest players');
      
      console.log('All indexes have been successfully updated');
    } catch (err) {
      console.error('Error updating indexes:', err);
    } finally {
      // Close the connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });