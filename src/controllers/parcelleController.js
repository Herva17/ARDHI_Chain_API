const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Constantes de validation
const typesTerrainValides = ['urbain', 'agricole', 'residentiel', 'commercial'];
const statutsValides = ['disponible', 'vendu', 'en_negociation'];
// Fonctions pour parser FormData
const parseBoolean = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value === 'on';
  }
  return Boolean(value);
};

const parseNumber = (value) => {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

const parseIntValue = (value) => {
  if (!value || value === '') return null;
  const num = parseInt(value);
  return isNaN(num) ? null : num;
};
// 🆕 CRÉER une parcelle avec FormData
const createParcelle = async (req, res) => {
  try {
    const {
      titre,
      quartier,
      avenue,
      numero,
      ville,
      superficie,
      description,
      prix_vente,
      type_terrain,
      utilisateur_id,
      role // 'proprietaire' ou 'commissionnaire'
    } = req.body;

    // Validation de base
    if (!titre || !quartier || !ville || !superficie || !type_terrain || !utilisateur_id || !role) {
      return res.status(400).json({
        error: 'Titre, quartier, ville, superficie, type_terrain, utilisateur_id et role sont requis'
      });
    }

    // Validation du type de terrain
    if (!typesTerrainValides.includes(type_terrain)) {
      return res.status(400).json({
        error: `Type de terrain invalide. Types valides: ${typesTerrainValides.join(', ')}`
      });
    }

    // Validation du rôle
    if (!['proprietaire', 'commissionnaire'].includes(role)) {
      return res.status(400).json({
        error: 'Role invalide. Doit être "proprietaire" ou "commissionnaire"'
      });
    }

    // Vérifier que l'utilisateur existe
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateur_id) }
    });

    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Préparer les données
    const parcelleData = {
      titre,
      quartier,
      avenue: avenue || null,
      numero: numero || null,
      ville,
      superficie: parseFloat(superficie),
      description: description || null,
      prix_vente: prix_vente ? parseFloat(prix_vente) : null,
      type_terrain,
      utilisateur_id: parseInt(utilisateur_id)
    };

    // Ajouter les URLs des images si elles existent
    if (req.imageUrls && req.imageUrls.length > 0) {
      parcelleData.images = req.imageUrls.join(',');
    }

    const parcelle = await prisma.parcelle.create({
      data: parcelleData,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            type: true
          }
        }
      }
    });

    // Transformer les images en tableau
    const parcelleAvecImages = {
      ...parcelle,
      images: parcelle.images ? parcelle.images.split(',') : [],
      role: role
    };

    res.status(201).json({
      message: 'Parcelle créée avec succès',
      data: parcelleAvecImages
    });

  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Utilisateur non trouvé' });
    }
    res.status(400).json({ error: error.message });
  }
};

// 📋 LIRE toutes les parcelles avec recherche avancée
const getParcelles = async (req, res) => {
  try {
    const { 
      type_terrain, 
      statut, 
      ville, 
      quartier,
      avenue,
      min_prix, 
      max_prix,
      min_superficie,
      max_superficie,
      search,
      page = 1, 
      limit = 10 
    } = req.query;

    const where = {};
    
    // Filtres de base
    if (type_terrain) where.type_terrain = type_terrain;
    if (statut) where.statut = statut;
    if (ville) where.ville = { contains: ville };
    if (quartier) where.quartier = { contains: quartier };
    if (avenue) where.avenue = { contains: avenue };
    
    // Filtre par prix
    if (min_prix || max_prix) {
      where.prix_vente = {};
      if (min_prix) where.prix_vente.gte = parseFloat(min_prix);
      if (max_prix) where.prix_vente.lte = parseFloat(max_prix);
    }

    // Filtre par superficie
    if (min_superficie || max_superficie) {
      where.superficie = {};
      if (min_superficie) where.superficie.gte = parseFloat(min_superficie);
      if (max_superficie) where.superficie.lte = parseFloat(max_superficie);
    }

    // Recherche globale
    if (search) {
      where.OR = [
        { titre: { contains: search } },
        { quartier: { contains: search } },
        { avenue: { contains: search } },
        { ville: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [parcelles, total] = await Promise.all([
      prisma.parcelle.findMany({
        where,
        include: {
          utilisateur: {
            select: {
              id: true,
              nom: true,
              telephone: true,
              type: true
            }
          }
        },
        orderBy: { date_creation: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.parcelle.count({ where })
    ]);

    // Transformer les images en tableau
    const parcellesAvecImages = parcelles.map(parcelle => ({
      ...parcelle,
      images: parcelle.images ? parcelle.images.split(',') : []
    }));

    res.json({
      count: parcelles.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: parcellesAvecImages
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔍 RECHERCHER des parcelles par localisation
const searchParcelles = async (req, res) => {
  try {
    const { quartier, avenue, ville } = req.query;

    if (!quartier && !avenue && !ville) {
      return res.status(400).json({
        error: 'Au moins un critère de recherche (quartier, avenue ou ville) est requis'
      });
    }

    const where = {};

    if (quartier) where.quartier = { contains: quartier };
    if (avenue) where.avenue = { contains: avenue };
    if (ville) where.ville = { contains: ville };

    const parcelles = await prisma.parcelle.findMany({
      where,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            type: true
          }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Transformer les images en tableau
    const parcellesAvecImages = parcelles.map(parcelle => ({
      ...parcelle,
      images: parcelle.images ? parcelle.images.split(',') : []
    }));

    res.json({
      count: parcelles.length,
      data: parcellesAvecImages
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📊 STATISTIQUES par quartier
const getStatsByQuartier = async (req, res) => {
  try {
    const stats = await prisma.parcelle.groupBy({
      by: ['quartier', 'ville'],
      _count: {
        id: true
      },
      _avg: {
        prix_vente: true,
        superficie: true
      },
      where: {
        prix_vente: { not: null }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    res.json({
      data: stats.map(stat => ({
        quartier: stat.quartier,
        ville: stat.ville,
        nombre_parcelles: stat._count.id,
        prix_moyen: stat._avg.prix_vente,
        superficie_moyenne: stat._avg.superficie
      }))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📍 LISTE des quartiers disponibles
const getQuartiers = async (req, res) => {
  try {
    const { ville } = req.query;
    
    const where = {};
    if (ville) where.ville = { contains: ville };

    const quartiers = await prisma.parcelle.findMany({
      where,
      distinct: ['quartier'],
      select: {
        quartier: true,
        ville: true
      },
      orderBy: [
        { ville: 'asc' },
        { quartier: 'asc' }
      ]
    });

    res.json({
      count: quartiers.length,
      data: quartiers
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📍 LISTE des avenues par quartier
const getAvenuesByQuartier = async (req, res) => {
  try {
    const { quartier, ville } = req.query;

    if (!quartier) {
      return res.status(400).json({
        error: 'Le paramètre quartier est requis'
      });
    }

    const where = {
      quartier: { contains: quartier },
      avenue: { not: null }
    };

    if (ville) where.ville = { contains: ville };

    const avenues = await prisma.parcelle.findMany({
      where,
      distinct: ['avenue'],
      select: {
        avenue: true,
        quartier: true,
        ville: true
      },
      orderBy: { avenue: 'asc' }
    });

    res.json({
      count: avenues.length,
      data: avenues
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔍 LIRE une parcelle par ID
const getParcelleById = async (req, res) => {
  try {
    const { id } = req.params;

    const parcelle = await prisma.parcelle.findUnique({
      where: { id: parseInt(id) },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            type: true,
            adresse: true
          }
        }
      }
    });

    if (!parcelle) {
      return res.status(404).json({ error: 'Parcelle non trouvée' });
    }

    // Transformer les images en tableau
    const parcelleAvecImages = {
      ...parcelle,
      images: parcelle.images ? parcelle.images.split(',') : []
    };

    res.json(parcelleAvecImages);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔍 LIRE les parcelles d'un utilisateur
const getParcellesByUtilisateur = async (req, res) => {
  try {
    const { utilisateur_id } = req.params;

    const parcelles = await prisma.parcelle.findMany({
      where: { utilisateur_id: parseInt(utilisateur_id) },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            type: true
          }
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Transformer les images en tableau
    const parcellesAvecImages = parcelles.map(parcelle => ({
      ...parcelle,
      images: parcelle.images ? parcelle.images.split(',') : []
    }));

    res.json({
      count: parcelles.length,
      data: parcellesAvecImages
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✏️ METTRE À JOUR une parcelle avec images
const updateParcelle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre,
      quartier,
      avenue,
      numero,
      ville,
      superficie,
      description,
      prix_vente,
      type_terrain,
      statut
    } = req.body;

    // Validation du type de terrain (si fourni)
    if (type_terrain && !typesTerrainValides.includes(type_terrain)) {
      return res.status(400).json({
        error: `Type de terrain invalide. Types valides: ${typesTerrainValides.join(', ')}`
      });
    }

    // Validation du statut (si fourni)
    if (statut && !statutsValides.includes(statut)) {
      return res.status(400).json({
        error: `Statut invalide. Statuts valides: ${statutsValides.join(', ')}`
      });
    }

    // Récupérer la parcelle existante
    const parcelleExistante = await prisma.parcelle.findUnique({
      where: { id: parseInt(id) }
    });

    if (!parcelleExistante) {
      return res.status(404).json({ error: 'Parcelle non trouvée' });
    }

    // Préparer les données de mise à jour
    const updateData = {
      titre,
      quartier,
      avenue: avenue || null,
      numero: numero || null,
      ville,
      superficie: superficie ? parseFloat(superficie) : undefined,
      description,
      prix_vente: prix_vente ? parseFloat(prix_vente) : undefined,
      type_terrain,
      statut
    };

    // Gérer les images
    if (req.imageUrls && req.imageUrls.length > 0) {
      // Remplacer toutes les images par les nouvelles
      updateData.images = req.imageUrls.join(',');
    }

    const parcelle = await prisma.parcelle.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            type: true
          }
        }
      }
    });

    // Transformer les images en tableau
    const parcelleAvecImages = {
      ...parcelle,
      images: parcelle.images ? parcelle.images.split(',') : []
    };

    res.json({
      message: 'Parcelle mise à jour avec succès',
      data: parcelleAvecImages
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Parcelle non trouvée' });
    }
    res.status(400).json({ error: error.message });
  }
};

// 🗑️ SUPPRIMER une parcelle
const deleteParcelle = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.parcelle.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Parcelle supprimée avec succès' });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Parcelle non trouvée' });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createParcelle,
  getParcelles,
  getParcelleById,
  getParcellesByUtilisateur,
  updateParcelle,
  deleteParcelle,
  searchParcelles,
  getStatsByQuartier,
  getQuartiers,
  getAvenuesByQuartier
};