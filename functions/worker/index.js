const functions = require('firebase-functions');
const processors = require('./processors');

module.exports = functions
  .runWith({
    memory: '512MB',
  })
  .pubsub.schedule('* * * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (_) => {
    await processors.sendScheduledPillNotification();
  });
