require("./config/env");
const { PORT } = require("./config/env");
const { createApp } = require("./app");

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Node Express BE running on http://localhost:${PORT}`);
});
