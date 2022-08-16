const admin = require('firebase-admin');
const serviceAccount = require('./sobok-76d0a-firebase-adminsdk-qb2ez-a9bbadc4b6.json');
const dotenv = require('dotenv');

dotenv.config();

let firebase;
if (admin.apps.length === 0) {
  firebase = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  firebase = admin.app();
}

module.exports = {
  api: require('./api'),
  worker: require('./worker'),
};
