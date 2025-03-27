const cron = require("node-cron");
const rolloverModel = require("../models/rollover");
const { fetchAndApprovePendingInvestmentTransactions } = require('../controller/rolloverController')

// const getNextRolloverTime = (currentTime, period) => {
//   const nextTime = new Date(currentTime);
//   if (period === "15min") nextTime.setMinutes(nextTime.getMinutes() + 15);
//   if (period === "4hr") nextTime.setHours(nextTime.getHours() + 4);
//   if (period === "daily") nextTime.setDate(nextTime.getDate() + 1);
//   return nextTime;
// };

const getNextRolloverTime = (currentTime, period) => {
  let nextTime = new Date(currentTime);

  if (period === "15min") {
    nextTime.setMinutes(nextTime.getMinutes() + 15);
  } else if (period === "4hr") {
    nextTime.setHours(nextTime.getHours() + 4);
  } else if (period === "daily") {
    nextTime.setDate(nextTime.getDate() + 1);
  }

  // Ensure next rollover is only on weekdays (Mon-Fri)
  while (nextTime.getDay() === 6 || nextTime.getDay() === 0) {
    nextTime.setDate(nextTime.getDate() + 1);
  }

  return nextTime;
};


const processRollover=async(rollover_id)=>{
  try {
    const rollover = await rolloverModel.findById(rollover_id)
    console.log(rollover,'rollover');
    
    if (!rollover) return console.log("Rollover not found!");
    
    //-----Operations--------------
    await fetchAndApprovePendingInvestmentTransactions(rollover_id)
    
    rollover.status = "completed";
    rollover.processed_at = new Date();
    await rollover.save();
    console.log(`Rollover ${rollover._id} completed at ${rollover.processed_at}`);
  } catch (error) {
    console.log( " Error while rollover" ,error);
  }
}

const createRollover = async (period) => {
  const rollover = new rolloverModel({
    period: period,
    start_time: new Date(),
    status: "pending",
    next_rollover_time: getNextRolloverTime(new Date(), period),
  });

  await rollover.save();
  await processRollover(rollover._id);
};

cron.schedule("0 */4 * * 1-5", async () => {
  console.log("Running 4-hour rollover...");
  createRollover("4hr");
});

// Schedule 15-minute rollover (for testing)
// cron.schedule("*/15 * * * *", async () => {
//   console.log("Running 15-minute rollover...");
//   createRollover("15min");
// });

