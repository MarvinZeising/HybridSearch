import { Hono } from 'hono';
import { cors } from 'hono/cors';
import routes from './routes.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import initializer from './middleware/initializer.ts';
import connectMongoDB from './mongodb.ts';

await connectMongoDB();
await initializer.initialize();

const app = new Hono();
app.use('*', cors());

app.get('/health', async (c) => {
  if (!initializer.getStatus()) {
    return c.json({ status: 'initializing' }, 503);
  }
  return c.json({ status: 'healthy' }, 200);
});

app.route('/api', routes);

app.onError(errorHandler);

app.notFound((c) => {
  return c.json({status: 404, message: 'Not Found'}, 404)
})

export default {
  port: 4000,
  fetch: app.fetch
}
