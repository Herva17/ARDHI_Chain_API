const jwt = require('jsonwebtoken');

// Clé secrète pour signer les tokens
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee_en_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Génère un token JWT
 */
const signToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'ardhi-api',
    }
  );
};

/**
 * Vérifie et décode un token JWT
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};

module.exports = {
  signToken,
  verifyToken,
  JWT_SECRET
};