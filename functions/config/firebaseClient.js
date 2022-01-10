const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyDabqXXI9ihGEyaIatHy2PFLLxXLbbHAjY',
  authDomain: 'sobok-76d0a.firebaseapp.com',
  projectId: 'sobok-76d0a',
  storageBucket: 'sobok-76d0a.appspot.com',
  messagingSenderId: '883944213656',
  appId: '1:883944213656:web:21e962650a0baa7a1c94ed',
  measurementId: 'G-L2H4PVL2B5',
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

module.exports = { firebaseApp, firebaseAuth, firebaseConfig };
