const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 🆕 CRÉER un utilisateur
const createUser = async (req, res) => {
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
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      data: user
    });
    
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(400).json({ error: error.message });
  }
};

// 📋 LIRE tous les utilisateurs
const getUsers = async (req, res) => {
  try {
    const users = await prisma.utilisateur.findMany({
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        type: true,
        adresse: true,
        date_inscription: true
      },
      orderBy: {
        date_inscription: 'desc'
      }
    });
    
    res.json({
      count: users.length,
      data: users
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔍 LIRE un utilisateur par ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.utilisateur.findUnique({
      where: { id: parseInt(id) },
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
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✏️ METTRE À JOUR un utilisateur
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, telephone, adresse } = req.body;
    
    const user = await prisma.utilisateur.update({
      where: { id: parseInt(id) },
      data: { nom, telephone, adresse },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        type: true,
        adresse: true
      }
    });
    
    res.json({
      message: 'Utilisateur mis à jour avec succès',
      data: user
    });
    
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.status(400).json({ error: error.message });
  }
};

// 🗑️ SUPPRIMER un utilisateur
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.utilisateur.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
    
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};