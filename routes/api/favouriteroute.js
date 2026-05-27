const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middleware/verifyJWT');
const controller = require('../../logcontroller/favouriteController');

router.use(verifyJWT);

router.post('/favourites', controller.addFavourite);             // POST /buyer/favourites
router.get('/favourites', controller.getFavourites);             // GET  /buyer/favourites
router.delete('/favourites/:vehicleId', controller.removeFavourite); // DELETE /buyer/favourites/:vehicleId

module.exports = router;
