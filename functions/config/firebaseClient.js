const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
  apiKey: 'AIzaSyAF8yzRwU-k3yWppNxcc8jA3iEdw_n0Uck',
  authDomain: 'soboksobok-564b3.firebaseapp.com',
  projectId: 'soboksobok-564b3',
  storageBucket: 'soboksobok-564b3.appspot.com',
  messagingSenderId: '979941539519',
  appId: '1:979941539519:web:4b465dce43afe76707900a',
  measurementId: 'G-28YMMZB5Y6',
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

module.exports = { firebaseApp, firebaseAuth, firebaseConfig };
