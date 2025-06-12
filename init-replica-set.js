// init-replica-set.js
print('Starting replica set initialization...');

// Wait for MongoDB to be ready
let isMaster = db.runCommand({ isMaster: 1 });
while (!isMaster.ismaster) {
    print('Waiting for MongoDB to be ready...');
    sleep(1000);
    isMaster = db.runCommand({ isMaster: 1 });
}

try {
    rs.initiate({
        _id: "rs0",
        members: [
            { _id: 0, host: "mongodb:27017" }
        ]
    });
    print('Replica set initialized successfully');
} catch (error) {
    print('Error initializing replica set:', error);
} 