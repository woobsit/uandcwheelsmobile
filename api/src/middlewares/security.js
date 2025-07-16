const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const securityMiddlewares = [
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
  helmet(),
  express.json(),
  express.urlencoded({ extended: true }),
];

module.exports = { securityMiddlewares };
