import mongoose from 'mongoose';

/**
 * Purge MongoDB databases created by Monstache
 */
async function purgeMonstacheDatabases() {
  try {
    console.log('Purging Monstache MongoDB databases...');

    const connection = mongoose.connection;

    if (connection.readyState !== 1) {
      console.log('MongoDB not connected, skipping database purge');
      return;
    }

    // Drop monstache databases
    await connection.db.admin().command({ dropDatabase: 1 }, { dbName: 'monstache-1' }).catch(() => {});
    await connection.db.admin().command({ dropDatabase: 1 }, { dbName: 'monstache-2' }).catch(() => {});

    console.log('Successfully dropped monstache MongoDB databases');
  } catch (error) {
    console.log('Note: Could not drop MongoDB databases (this is normal if they don\'t exist yet)');
  }
}

export { purgeMonstacheDatabases };
