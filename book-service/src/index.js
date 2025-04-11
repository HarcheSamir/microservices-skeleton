require('dotenv').config();
const app = require('./config/app');
const  PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Book service running on port ${PORT}`);
});