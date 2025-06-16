const express =require( 'express');
const helmet =require( 'helmet');
const cors =require( 'cors');

 const securityMiddlewares = [
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    credentials: true,
  }),
  helmet(),
  express.json(),
  express.urlencoded({ extended: true }),
];

module.exports = {securityMiddlewares}