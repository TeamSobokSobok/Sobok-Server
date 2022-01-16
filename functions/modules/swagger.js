const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  swaggerDefinition: {
    info: {
      title: 'SobokSobok-Server',
      version: '1.0.0',
      description: 'RESTful API spec for SobokSobok Service',
    },
    host: 'https://asia-northeast3-sobok-76d0a.cloudfunctions.net/api',
    basePath: '/',
  },
  apis: ['./routes/*.js', './swagger/*'],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
