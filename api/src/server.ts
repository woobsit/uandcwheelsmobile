import { server } from './app'; // Imports the HTTP server instance
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

// Starts the server 
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});