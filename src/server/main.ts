import express from 'express';
import ViteExpress from 'vite-express';

const app = express();

app.get('/message', (_, res) => {
  res.send('Hello from express')
});

const port = 3000;
ViteExpress.listen(app, port, () => {
  console.log(`Server is listening at port ${port}`);
});
