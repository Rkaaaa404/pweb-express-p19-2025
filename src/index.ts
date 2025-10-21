// src/index.ts

import express from 'express';
import 'dotenv/config';
import mainRouter from './router/indexRouter'; 

const app = express();
app.use(express.json());

app.get('/health-check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running well!',
    date: new Date().toISOString(),
  });
});

app.use('/', mainRouter);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});