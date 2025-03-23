const cron = require("node-cron");
const rolloverModel = require("../models/rollover");
const { fetchAndApprovePendingInvestmentTransactions } = require('../controller/rolloverController')

const getNextRolloverTime = (currentTime, period) => {
    const nextTime = new Date(currentTime);
    if (period === "daily") nextTime.setDate(nextTime.getDate() + 1);
    if (period === "weekly") nextTime.setDate(nextTime.getDate() + 7);
    if (period === "monthly") nextTime.setMonth(nextTime.getMonth() + 1);
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

const createRollover = async()=>{
  const rollover = new rolloverModel({
  period: "daily",
  start_time: new Date(),
  status: "pending",
  next_rollover_time:getNextRolloverTime(new Date(), "daily")
  });
  
  await rollover.save();
  await processRollover(rollover._id);
}

// Schedule daily rollover at midnight UTC
// cron.schedule("*/15 * * * *", async () => {
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily rollover...");
  createRollover()  
});

// createRollover()

