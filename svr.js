import express from 'express';

const app = express();
app.use('/induction', express.static('docs'));
app.listen(8080);
