// Wait for MongoDB to be ready
sleep(10000);

// Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb:27017" }
  ]
});

// Wait for replica set to be initialized
sleep(5000);

// Create admin user
db = db.getSiblingDB('admin');
db.createUser({
  user: 'admin',
  pwd: 'adminpassword',
  roles: [
    { role: 'root', db: 'admin' }
  ]
});

// Create application database and user
db = db.getSiblingDB('news');
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    { role: 'readWrite', db: 'news' }
  ]
}); 