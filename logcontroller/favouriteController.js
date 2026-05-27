// controller/favouritesController.js
const Favourite = require('../model/favourites');
const Product = require('../model/products');

exports.addFavourite = async (req, res) => {
  const email = req.user;
  const vehicleId = req.body.vehicleId;

  try {
    const existing = await Favourite.findOne({ email, vehicle: vehicleId });
    if (existing) return res.status(409).json({ message: 'Already favourited' });

    const fav = new Favourite({ email, vehicle: vehicleId });
    await fav.save();
    res.status(201).json({ message: 'Added to favourites' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving favourite' });
  }
};

exports.getFavourites = async (req, res) => {
  const email = req.user;

  try {
    // In your /buyer/favourites controller
 const favs = await Favourite.find({ email }).populate('vehicle');
    const validVehicles =
      favs
        .filter(f => f.vehicle)
        .map(f => f.vehicle);

    res.json(validVehicles);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching favourites' });
  }
};
exports.removeFavourite = async (req, res) => {
  const email = req.user;
  const vehicleId = req.params.vehicleId;

  try {
    const result = await Favourite.findOneAndDelete({ email, vehicle: vehicleId });

    if (!result) {
      return res.status(404).json({ message: 'Favourite not found' });
    }

    res.json({ message: 'Removed from favourites' });
  } catch (err) {
    console.error('Error removing favourite:', err);
    res.status(500).json({ message: 'Error removing favourite' });
  }
};
