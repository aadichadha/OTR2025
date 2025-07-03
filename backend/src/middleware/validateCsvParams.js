/**
 * Middleware to validate CSV upload parameters
 */
module.exports = (req, res, next) => {
  const { playerId, playerCode } = req.body;
  if (!playerId && !playerCode) {
    return res.status(400).json({ error: 'playerId or playerCode is required' });
  }
  next();
}; 