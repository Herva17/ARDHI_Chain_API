const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware pour authentifier les requêtes avec JWT
 */
const authenticateToken = async (req, res, next) => {
   if (process.env.DISABLE_AUTH === 'true') {
    console.log('⚠️  Auth désactivée pour test');
    return next();
  }
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Token d\'authentification requis' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee_en_production');
    
    const user = await prisma.utilisateur.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        type: true,
        adresse: true,
        date_inscription: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

module.exports = {
  authenticateToken
};