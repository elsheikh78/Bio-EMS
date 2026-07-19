import app from "./app";
import { config } from "./config/config";

const PORT = config.port;

app.listen(PORT, () => {
  console.log("==================================");
  console.log(" BIO EMS Backend Started");
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Listening   : http://localhost:${PORT}`);
  console.log("==================================");
});