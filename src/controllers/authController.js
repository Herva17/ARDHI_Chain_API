const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Fonction signToken locale
const signToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
    },
    process.env.JWT_SECRET || 'votre_cle_secrete_super_securisee_en_production',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'ardhi-api',
    }
  );
};

// 🔐 Se connecter (login)
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: 'Email et mot_de_passe sont requis' });
    }

    const user = await prisma.utilisateur.findUnique({ 
      where: { email } 
    });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isMatch) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = signToken({ id: user.id, email: user.email });
    const { mot_de_passe: _mp, ...safeUser } = user;
    res.json({ 
      message: 'Connecté avec succès', 
      token, 
      data: safeUser 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📝 S'inscrire (register)
const register = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, telephone, type, adresse } = req.body;
    
    if (!nom || !email || !mot_de_passe || !type) {
      return res.status(400).json({ 
        error: 'Nom, email, mot_de_passe et type sont requis' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const user = await prisma.utilisateur.create({
      data: { 
        nom, 
        email, 
        mot_de_passe: hashedPassword, 
        telephone, 
        type,
        adresse
      },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        type: true,
        adresse: true,
        date_inscription: true
      }
    });
    
    const token = signToken({ id: user.id, email: user.email });
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      data: user,
      token
    });
    
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(400).json({ error: error.message });
  }
};

// 🔍 Vérifier l'authentification
const checkAuth = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        authenticated: false,
        error: 'Token manquant' 
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
        date_inscription: true
      }
    });

    if (!user) {
      return res.status(401).json({
        authenticated: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      authenticated: true,
      data: user
    });

  } catch (error) {
    res.status(401).json({
      authenticated: false,
      error: 'Token invalide ou expiré'
    });
  }
};

module.exports = {
  login,
  register,
  checkAuth
};