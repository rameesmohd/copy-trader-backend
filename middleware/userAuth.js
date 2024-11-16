const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
    try {
      const token = req.header('Authorization');
      if (!token) {
        return res.status(401).json({ msg: 'Authentication failed: No token provided.' });
      }
  
      if (!token.startsWith('Bearer')) {
        return res.status(401).json({ msg: 'Authentication failed: Invalid token format.' });
      }
  
    const tokenWithoutBearer = token.slice(7).trim();
    
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET_KEY);
    console.log('decoded : '+decoded);
    req.decodedUser = decoded;
    if (decoded.role === 'user') {
         return next();
     } else {
      return res.status(403).json({ message: 'Authentication failed: Invalid role.' });
     }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log('TokenExpiredError');
        return res.status(401).json({ msg: 'Authentication failed: Token has expired.' });
      }
      return res.status(401).json({ msg: 'Authentication failed: Invalid token.' });
    }
  };
  
  module.exports = { 
    verifyToken
  }