const admin = require('firebase-admin');
const serviceAccount = require('./soboksobok-564b3-firebase-adminsdk-l4k48-9fb0a1d554.json');
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
