import express from 'express';
import { env } from './config/env.config.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { error } from './middlewares/error.middleware.js';
import morgan from 'morgan';

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use(notFound);
app.use(error);

const port = env.PORT;
app.listen(port, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`server running on port: ${port}`);
});
