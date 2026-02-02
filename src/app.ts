import express from 'express';
import { env } from './config/env.config.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { error } from './middlewares/error.middleware.js';
import morgan from 'morgan';
import { authRouter } from './routes/auth.route.js';
import cors from 'cors';

const app = express();

app.use(cors({ origin: [env.FRONTEND_URL], credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/auth', authRouter);

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
