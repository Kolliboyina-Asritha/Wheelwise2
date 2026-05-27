const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req?.roles) return res.sendStatus(401); // Unauthorized

    const userRoles = Array.isArray(req.roles)
      ? req.roles
      : Object.values(req.roles); // ✅ convert object to array of numbers

    const hasRole = userRoles.some(role => allowedRoles.includes(role));
    if (!hasRole) return res.sendStatus(403); // Forbidden

    next();
  };
};

module.exports = verifyRoles;
