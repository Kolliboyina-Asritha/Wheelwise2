const BuyerDetails = require('../model/buyerDetails');


// GET /buyer/details
exports.getDetails = async (req, res) => {
  const email = req.user; // ✅ this is correct
  try {
    const details = await BuyerDetails.findOne({ email });
    res.json(details || {});
  } catch (err) {
    console.error("Error in getBuyerDetails:", err);
    res.status(500).json({ message: 'Error getting buyer details' });
  }
};

exports.upsertBuyerDetails = async (req, res) => {
  try {
    const email = req.user;

    if (!email) {
      return res.status(400).json({ message: 'Email missing from token. Cannot save buyer details.' });
    }

    const update = { ...req.body, email };

    const result = await BuyerDetails.findOneAndUpdate(
      { email },
      update,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(result);
  } catch (err) {
    console.error('Error updating or inserting details:', err);
    res.status(500).json({ message: 'Server error saving details' });
  }
};

