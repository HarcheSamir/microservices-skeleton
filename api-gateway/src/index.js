const app = require('./config/app');
const  PORT  = process.env.PORT;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});