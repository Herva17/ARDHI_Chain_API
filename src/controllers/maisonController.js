const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Constantes de validation
const etatsValides = ['neuf', 'bon_etat', 'renovation', 'ancien'];
const typesMaisonValides = ['villa', 'appartement', 'duplex', 'studio', 'fermette', 'contemporaine'];
const standingsValides = ['luxe', 'haut_de_gamme', 'standard', 'economique'];
const typesOffreValides = ['vente', 'location', 'vente_location'];
const statutsValides = ['disponible', 'loue', 'vendu', 'en_negociation'];

// Fonctions utilitaires
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

// 🆕 CRÉER une maison
const createMaison = async (req, res) => {
  try {
    const {
      titre,
      nombre_chambres,
      nombre_salles_bain,
      surface_totale,
      etat,
      type_maison,
      standing,
      type_offre,
      parcelle_id,
      description,
      jardin,
      garage,
      piscine,
      prix_vente,
      prix_location,
      statut
    } = req.body;

    // Validation des champs requis
    const requiredFields = ['titre', 'nombre_chambres', 'nombre_salles_bain', 'surface_totale', 
                           'etat', 'type_maison', 'standing', 'type_offre', 'parcelle_id'];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    // Validation des valeurs
    if (!etatsValides.includes(etat)) {
      return res.status(400).json({
        error: `État invalide. États valides: ${etatsValides.join(', ')}`
      });
    }

    if (!typesMaisonValides.includes(type_maison)) {
      return res.status(400).json({
        error: `Type de maison invalide. Types valides: ${typesMaisonValides.join(', ')}`
      });
    }

    if (!standingsValides.includes(standing)) {
      return res.status(400).json({
        error: `Standing invalide. Standings valides: ${standingsValides.join(', ')}`
      });
    }

    if (!typesOffreValides.includes(type_offre)) {
      return res.status(400).json({
        error: `Type d'offre invalide. Types valides: ${typesOffreValides.join(', ')}`
      });
    }

    if (statut && !statutsValides.includes(statut)) {
      return res.status(400).json({
        error: `Statut invalide. Statuts valides: ${statutsValides.join(', ')}`
      });
    }

    // Vérifier que la parcelle existe
    const parcelle = await prisma.parcelle.findUnique({
      where: { id: parseInt(parcelle_id) },
      include: { utilisateur: true }
    });

    if (!parcelle) {
      return res.status(404).json({ error: 'Parcelle non trouvée' });
    }

    // Préparer les données
    const maisonData = {
      titre,
      nombre_chambres: parseInt(nombre_chambres),
      nombre_salles_bain: parseInt(nombre_salles_bain),
      surface_totale: parseFloat(surface_totale),
      etat,
      type_maison,
      standing,
      type_offre,
      parcelle_id: parseInt(parcelle_id),
      description: description || null,
      jardin: parseBoolean(jardin),
      garage: parseBoolean(garage),
      piscine: parseBoolean(piscine),
      prix_vente: prix_vente ? parseFloat(prix_vente) : null,
      prix_location: prix_location ? parseFloat(prix_location) : null,
      statut: statut || 'disponible'
    };

    // Ajouter les URLs des images si elles existent
    if (req.imageUrls && req.imageUrls.length > 0) {
      maisonData.images = req.imageUrls.join(',');
    }

    // Créer la maison
    const maison = await prisma.maison.create({
      data: maisonData,
      include: {
        parcelle: {
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
        }
      }
    });

    // Transformer les images en tableau
    const maisonAvecImages = {
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    };

    res.status(201).json({
      message: 'Maison créée avec succès',
      data: maisonAvecImages
    });

  } catch (error) {
    console.error('Erreur création maison:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Parcelle non trouvée' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Une maison avec ces caractéristiques existe déjà' });
    }
    
    res.status(400).json({ 
      error: error.message,
      code: error.code
    });
  }
};

// 📋 LIRE toutes les maisons avec filtres avancés
const getMaisons = async (req, res) => {
  try {
    const { 
      type_maison, 
      etat,
      standing,
      type_offre,
      statut,
      min_chambres,
      max_chambres,
      min_salles_bain,
      max_salles_bain,
      min_surface,
      max_surface,
      min_prix_vente,
      max_prix_vente,
      min_prix_location,
      max_prix_location,
      jardin,
      garage,
      piscine,
      ville,
      quartier,
      search,
      page = 1, 
      limit = 10 
    } = req.query;

    const where = {};

    // Filtres de base
    if (type_maison) where.type_maison = type_maison;
    if (etat) where.etat = etat;
    if (standing) where.standing = standing;
    if (type_offre) where.type_offre = type_offre;
    if (statut) where.statut = statut;

    // Filtres booléens
    if (jardin !== undefined) where.jardin = parseBoolean(jardin);
    if (garage !== undefined) where.garage = parseBoolean(garage);
    if (piscine !== undefined) where.piscine = parseBoolean(piscine);

    // Filtres numériques
    if (min_chambres || max_chambres) {
      where.nombre_chambres = {};
      if (min_chambres) where.nombre_chambres.gte = parseInt(min_chambres);
      if (max_chambres) where.nombre_chambres.lte = parseInt(max_chambres);
    }

    if (min_salles_bain || max_salles_bain) {
      where.nombre_salles_bain = {};
      if (min_salles_bain) where.nombre_salles_bain.gte = parseInt(min_salles_bain);
      if (max_salles_bain) where.nombre_salles_bain.lte = parseInt(max_salles_bain);
    }

    if (min_surface || max_surface) {
      where.surface_totale = {};
      if (min_surface) where.surface_totale.gte = parseFloat(min_surface);
      if (max_surface) where.surface_totale.lte = parseFloat(max_surface);
    }

    if (min_prix_vente || max_prix_vente) {
      where.prix_vente = {};
      if (min_prix_vente) where.prix_vente.gte = parseFloat(min_prix_vente);
      if (max_prix_vente) where.prix_vente.lte = parseFloat(max_prix_vente);
    }

    if (min_prix_location || max_prix_location) {
      where.prix_location = {};
      if (min_prix_location) where.prix_location.gte = parseFloat(min_prix_location);
      if (max_prix_location) where.prix_location.lte = parseFloat(max_prix_location);
    }

    // Filtres par localisation (via parcelle)
    if (ville || quartier || search) {
      where.parcelle = {};
      if (ville) where.parcelle.ville = { contains: ville };
      if (quartier) where.parcelle.quartier = { contains: quartier };
      
      if (search) {
        where.parcelle.OR = [
          { ville: { contains: search } },
          { quartier: { contains: search } },
          { avenue: { contains: search } }
        ];
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [maisons, total] = await Promise.all([
      prisma.maison.findMany({
        where,
        include: {
          parcelle: {
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
          }
        },
        orderBy: { date_creation: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.maison.count({ where })
    ]);

    // Transformer les images en tableau
    const maisonsAvecImages = maisons.map(maison => ({
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    }));

    res.json({
      count: maisons.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: maisonsAvecImages
    });

  } catch (error) {
    console.error('Erreur récupération maisons:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔍 LIRE une maison par ID
const getMaisonById = async (req, res) => {
  try {
    const { id } = req.params;

    const maison = await prisma.maison.findUnique({
      where: { id: parseInt(id) },
      include: {
        parcelle: {
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
        }
      }
    });

    if (!maison) {
      return res.status(404).json({ error: 'Maison non trouvée' });
    }

    // Transformer les images en tableau
    const maisonAvecImages = {
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    };

    res.json(maisonAvecImages);

  } catch (error) {
    console.error('Erreur récupération maison:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔍 LIRE les maisons d'une parcelle
const getMaisonsByParcelle = async (req, res) => {
  try {
    const { parcelle_id } = req.params;

    const maisons = await prisma.maison.findMany({
      where: { parcelle_id: parseInt(parcelle_id) },
      include: {
        parcelle: {
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
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Transformer les images en tableau
    const maisonsAvecImages = maisons.map(maison => ({
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    }));

    res.json({
      count: maisons.length,
      data: maisonsAvecImages
    });

  } catch (error) {
    console.error('Erreur récupération maisons par parcelle:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔍 LIRE les maisons d'un utilisateur
const getMaisonsByUtilisateur = async (req, res) => {
  try {
    const { utilisateur_id } = req.params;

    const maisons = await prisma.maison.findMany({
      where: {
        parcelle: {
          utilisateur_id: parseInt(utilisateur_id)
        }
      },
      include: {
        parcelle: {
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
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Transformer les images en tableau
    const maisonsAvecImages = maisons.map(maison => ({
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    }));

    res.json({
      count: maisons.length,
      data: maisonsAvecImages
    });

  } catch (error) {
    console.error('Erreur récupération maisons par utilisateur:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✏️ METTRE À JOUR une maison
const updateMaison = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre,
      nombre_chambres,
      nombre_salles_bain,
      surface_totale,
      etat,
      type_maison,
      standing,
      type_offre,
      description,
      jardin,
      garage,
      piscine,
      prix_vente,
      prix_location,
      statut,
      parcelle_id
    } = req.body;

    // Vérifier que la maison existe
    const maisonExistante = await prisma.maison.findUnique({
      where: { id: parseInt(id) }
    });

    if (!maisonExistante) {
      return res.status(404).json({ error: 'Maison non trouvée' });
    }

    // Validation des valeurs
    if (etat && !etatsValides.includes(etat)) {
      return res.status(400).json({
        error: `État invalide. États valides: ${etatsValides.join(', ')}`
      });
    }

    if (type_maison && !typesMaisonValides.includes(type_maison)) {
      return res.status(400).json({
        error: `Type de maison invalide. Types valides: ${typesMaisonValides.join(', ')}`
      });
    }

    if (standing && !standingsValides.includes(standing)) {
      return res.status(400).json({
        error: `Standing invalide. Standings valides: ${standingsValides.join(', ')}`
      });
    }

    if (type_offre && !typesOffreValides.includes(type_offre)) {
      return res.status(400).json({
        error: `Type d'offre invalide. Types valides: ${typesOffreValides.join(', ')}`
      });
    }

    if (statut && !statutsValides.includes(statut)) {
      return res.status(400).json({
        error: `Statut invalide. Statuts valides: ${statutsValides.join(', ')}`
      });
    }

    // Vérifier la parcelle si elle est modifiée
    if (parcelle_id) {
      const parcelle = await prisma.parcelle.findUnique({
        where: { id: parseInt(parcelle_id) }
      });

      if (!parcelle) {
        return res.status(404).json({ error: 'Parcelle non trouvée' });
      }
    }

    // Préparer les données de mise à jour
    const updateData = {};

    // Ajouter les champs seulement s'ils sont fournis
    if (titre !== undefined) updateData.titre = titre;
    if (nombre_chambres !== undefined) updateData.nombre_chambres = parseInt(nombre_chambres);
    if (nombre_salles_bain !== undefined) updateData.nombre_salles_bain = parseInt(nombre_salles_bain);
    if (surface_totale !== undefined) updateData.surface_totale = parseFloat(surface_totale);
    if (etat !== undefined) updateData.etat = etat;
    if (type_maison !== undefined) updateData.type_maison = type_maison;
    if (standing !== undefined) updateData.standing = standing;
    if (type_offre !== undefined) updateData.type_offre = type_offre;
    if (description !== undefined) updateData.description = description;
    if (jardin !== undefined) updateData.jardin = parseBoolean(jardin);
    if (garage !== undefined) updateData.garage = parseBoolean(garage);
    if (piscine !== undefined) updateData.piscine = parseBoolean(piscine);
    if (prix_vente !== undefined) updateData.prix_vente = prix_vente ? parseFloat(prix_vente) : null;
    if (prix_location !== undefined) updateData.prix_location = prix_location ? parseFloat(prix_location) : null;
    if (statut !== undefined) updateData.statut = statut;
    if (parcelle_id !== undefined) updateData.parcelle_id = parseInt(parcelle_id);

    // Gérer les images
    if (req.imageUrls && req.imageUrls.length > 0) {
      // Remplacer toutes les images par les nouvelles
      updateData.images = req.imageUrls.join(',');
    }

    const maison = await prisma.maison.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        parcelle: {
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
        }
      }
    });

    // Transformer les images en tableau
    const maisonAvecImages = {
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    };

    res.json({
      message: 'Maison mise à jour avec succès',
      data: maisonAvecImages
    });

  } catch (error) {
    console.error('Erreur mise à jour maison:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Maison non trouvée' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Parcelle non trouvée' });
    }
    
    res.status(400).json({ error: error.message });
  }
};

// 🗑️ SUPPRIMER une maison
const deleteMaison = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la maison existe
    const maison = await prisma.maison.findUnique({
      where: { id: parseInt(id) }
    });

    if (!maison) {
      return res.status(404).json({ error: 'Maison non trouvée' });
    }

    await prisma.maison.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      message: 'Maison supprimée avec succès',
      deletedId: parseInt(id)
    });

  } catch (error) {
    console.error('Erreur suppression maison:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Maison non trouvée' });
    }
    
    res.status(500).json({ error: error.message });
  }
};

// 📊 STATISTIQUES des maisons
const getStatsMaisons = async (req, res) => {
  try {
    const { ville, quartier, type_offre } = req.query;

    const where = {};
    
    // Filtres optionnels
    if (type_offre) where.type_offre = type_offre;
    
    if (ville || quartier) {
      where.parcelle = {};
      if (ville) where.parcelle.ville = ville;
      if (quartier) where.parcelle.quartier = quartier;
    }

    const stats = await prisma.maison.groupBy({
      by: ['type_maison', 'standing', 'etat', 'type_offre'],
      _count: {
        id: true
      },
      _avg: {
        prix_vente: true,
        prix_location: true,
        surface_totale: true,
        nombre_chambres: true,
        nombre_salles_bain: true
      },
      where,
      orderBy: [
        { type_maison: 'asc' },
        { standing: 'asc' }
      ]
    });

    // Statistiques générales
    const totalMaisons = await prisma.maison.count({ where });
    const totalVentes = await prisma.maison.count({ where: { ...where, type_offre: 'vente' } });
    const totalLocations = await prisma.maison.count({ where: { ...where, type_offre: 'location' } });
    const totalMixte = await prisma.maison.count({ where: { ...where, type_offre: 'vente_location' } });

    res.json({
      statistiques_generales: {
        total_maisons: totalMaisons,
        total_ventes: totalVentes,
        total_locations: totalLocations,
        total_mixte: totalMixte
      },
      details_par_categorie: stats.map(stat => ({
        type_maison: stat.type_maison,
        standing: stat.standing,
        etat: stat.etat,
        type_offre: stat.type_offre,
        nombre_maisons: stat._count.id,
        prix_vente_moyen: stat._avg.prix_vente,
        prix_location_moyen: stat._avg.prix_location,
        surface_moyenne: stat._avg.surface_totale,
        chambres_moyennes: stat._avg.nombre_chambres,
        salles_bain_moyennes: stat._avg.nombre_salles_bain
      }))
    });

  } catch (error) {
    console.error('Erreur statistiques maisons:', error);
    res.status(500).json({ error: error.message });
  }
};
// 🔍 RECHERCHER des maisons par localisation de parcelle
const searchMaisonsByLocation = async (req, res) => {
  try {
    const { quartier, avenue, ville } = req.query;

    if (!quartier && !avenue && !ville) {
      return res.status(400).json({
        error: 'Au moins un critère de recherche (quartier, avenue ou ville) est requis'
      });
    }

    const where = {};

    // Construire les filtres de localisation via la parcelle
    where.parcelle = {};
    
    if (quartier) where.parcelle.quartier = { contains: quartier };
    if (avenue) where.parcelle.avenue = { contains: avenue };
    if (ville) where.parcelle.ville = { contains: ville };

    const maisons = await prisma.maison.findMany({
      where,
      include: {
        parcelle: {
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
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Transformer les images en tableau
    const maisonsAvecImages = maisons.map(maison => ({
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    }));

    res.json({
      count: maisons.length,
      data: maisonsAvecImages
    });

  } catch (error) {
    console.error('Erreur recherche maisons par localisation:', error);
    res.status(500).json({ error: error.message });
  }
};
// 🔍 RECHERCHER des maisons avec critères avancés
const searchMaisons = async (req, res) => {
  try {
    const { 
      type_maison,
      standing,
      min_chambres,
      max_chambres,
      min_surface,
      max_surface,
      ville,
      quartier,
      avec_jardin,
      avec_garage,
      avec_piscine
    } = req.query;

    const where = {};

    // Filtres de base
    if (type_maison) where.type_maison = type_maison;
    if (standing) where.standing = standing;

    // Filtres numériques
    if (min_chambres || max_chambres) {
      where.nombre_chambres = {};
      if (min_chambres) where.nombre_chambres.gte = parseInt(min_chambres);
      if (max_chambres) where.nombre_chambres.lte = parseInt(max_chambres);
    }

    if (min_surface || max_surface) {
      where.surface_totale = {};
      if (min_surface) where.surface_totale.gte = parseFloat(min_surface);
      if (max_surface) where.surface_totale.lte = parseFloat(max_surface);
    }

    // Filtres booléens
    if (avec_jardin !== undefined) where.jardin = parseBoolean(avec_jardin);
    if (avec_garage !== undefined) where.garage = parseBoolean(avec_garage);
    if (avec_piscine !== undefined) where.piscine = parseBoolean(avec_piscine);

    // Filtres par localisation
    if (ville || quartier) {
      where.parcelle = {};
      if (ville) where.parcelle.ville = { contains: ville };
      if (quartier) where.parcelle.quartier = { contains: quartier };
    }

    const maisons = await prisma.maison.findMany({
      where,
      include: {
        parcelle: {
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
        }
      },
      orderBy: { date_creation: 'desc' }
    });

    // Transformer les images en tableau
    const maisonsAvecImages = maisons.map(maison => ({
      ...maison,
      images: maison.images ? maison.images.split(',') : [],
      proprietaire: maison.parcelle.utilisateur
    }));

    res.json({
      count: maisons.length,
      data: maisonsAvecImages
    });

  } catch (error) {
    console.error('Erreur recherche maisons:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createMaison,
  getMaisons,
  getMaisonById,
  getMaisonsByParcelle,
  getMaisonsByUtilisateur,
  updateMaison,
  deleteMaison,
  searchMaisons,
  getStatsMaisons,
  searchMaisonsByLocation
};