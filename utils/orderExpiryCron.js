const cron=require('node-cron');
const Order=require('../model/order');
// every 5 minutes
cron.schedule('*/5 * * * *', async () => {

  try {

    console.log('⏳ Checking expired Razorpay orders...');

    // 30 minutes ago
    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000
    );

    const result = await Order.updateMany(
  {
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'pending',
    status: 'placed',
    createdAt: { $lt: thirtyMinutesAgo }
  },
  {
    $set: {
      status: 'expired'
    }
  }
);
    console.log(
      `✅ Expired Orders Updated: ${result.modifiedCount}`
    );

  } catch (err) {

    console.error(
      '❌ Expiry Cron Error:',
      err
    );
  }
});
