const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const securityMiddlewares = [
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
  helmet(),
  express().use(express.json()),
  express().use(express.urlencoded({ extended: true })),
  express().use(cookieParser())
];

module.exports = { securityMiddlewares };
