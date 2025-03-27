const cron = require("node-cron");
const { handleInterval } = require('../controller/intervalController')


// Schedule job for every Saturday at 23:59 UTC
cron.schedule("59 23 * * 6", async () => {
    console.log("Processing trading interval at the end of the week...");
    await handleInterval();
}, {
    timezone: "UTC"
});