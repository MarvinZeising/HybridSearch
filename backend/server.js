import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import {errorHandler} from './middleware/errorHandler.js';
import initializationService from './middleware/initializationService.js';
import connectMongoDB from "./mongodb.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  if (!initializationService.getInitializationStatus()) {
    return res.status(503).json({ status: 'initializing' });
  }
  res.status(200).json({ status: 'healthy' });
});

app.use('/api', routes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectMongoDB();
    console.log('Database connected successfully');

    await initializationService.initialize();
    app.listen(4000, () => {
      console.log('---------------------------');
      console.log(`Server running on port 4000`);
      console.log('---------------------------');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
