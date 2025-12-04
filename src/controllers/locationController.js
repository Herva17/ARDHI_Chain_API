const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Constantes de validation
const statutsLocationValides = ['en_attente', 'en_cours', 'termine', 'resilie'];

// 🆕 CRÉER une location
const createLocation = async (req, res) => {
  try {
    const {
      maison_id,
      utilisateur_id,
      date_debut,
      date_fin,
      loyer_mensuel,
      caution,
      contrat_url
    } = req.body;

    // Validation des champs requis
    const requiredFields = ['maison_id', 'utilisateur_id', 'date_debut', 'date_fin', 'loyer_mensuel'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    // Vérifier que la maison existe
    const maison = await prisma.maison.findUnique({
      where: { id: parseInt(maison_id) }
    });

    if (!maison) {
      return res.status(404).json({ error: 'Maison non trouvée' });
    }

    // Vérifier que l'utilisateur (locataire) existe
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(utilisateur_id) }
    });

    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier que la maison est disponible
    if (maison.est_louee === true || maison.statut === 'loue') {
      return res.status(400).json({ 
        error: 'La maison n\'est pas disponible à la location'
      });
    }

    // Vérifier les dates
    const debut = new Date(date_debut);
    const fin = new Date(date_fin);
    
    if (debut >= fin) {
      return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
    }

    // Vérifier les conflits de dates
    const locationExistante = await prisma.location.findFirst({
      where: {
        maison_id: parseInt(maison_id),
        statut: { in: ['en_attente', 'en_cours'] },
        OR: [
          { date_debut: { lte: fin }, date_fin: { gte: debut } }
        ]
      }
    });

    if (locationExistante) {
      return res.status(409).json({ 
        error: 'La maison est déjà louée sur cette période'
      });
    }

    // Créer la location
    const locationData = {
      maison_id: parseInt(maison_id),
      utilisateur_id: parseInt(utilisateur_id),
      date_debut: debut,
      date_fin: fin,
      loyer_mensuel: parseFloat(loyer_mensuel),
      caution: caution ? parseFloat(caution) : null,
      contrat_url: contrat_url || null,
      statut: 'en_attente',
      solde_restant: parseFloat(loyer_mensuel) * (Math.ceil((fin - debut) / (1000 * 60 * 60 * 24 * 30))) // Estimation mois
    };

    const location = await prisma.location.create({
      data: locationData,
      include: {
        maison: {
          include: {
            parcelle: {
              select: {
                id: true,
                titre: true,
                quartier: true,
                ville: true
              }
            }
          }
        },
        utilisateur: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true
          }
        }
      }
    });

    // Mettre à jour le statut de la maison
    await prisma.maison.update({
      where: { id: parseInt(maison_id) },
      data: { 
        statut: 'en_negociation',
        est_louee: true 
      }
    });

    res.status(201).json({
      message: 'Location créée avec succès (en attente)',
      data: location
    });

  } catch (error) {
    console.error('Erreur création location:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'ID de maison ou utilisateur invalide' });
    }
    
    res.status(400).json({ error: error.message });
  }
};

// 📋 LIRE toutes les locations avec filtres simples
const getLocations = async (req, res) => {
  try {
    const { 
      statut,
      utilisateur_id,
      maison_id,
      page = 1, 
      limit = 10 
    } = req.query;

    const where = {};

    if (statut) where.statut = statut;
    if (utilisateur_id) where.utilisateur_id = parseInt(utilisateur_id);
    if (maison_id) where.maison_id = parseInt(maison_id);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          maison: {
            include: {
              parcelle: {
                select: {
                  id: true,
                  titre: true,
                  quartier: true,
                  ville: true
                }
              }
            }
          },
          utilisateur: {
            select: {
              id: true,
              nom: true,
              telephone: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.location.count({ where })
    ]);

    res.json({
      count: locations.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: locations
    });

  } catch (error) {
    console.error('Erreur récupération locations:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔍 LIRE une location par ID
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) },
      include: {
        maison: {
          include: {
            parcelle: true
          }
        },
        utilisateur: true
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location non trouvée' });
    }

    res.json(location);

  } catch (error) {
    console.error('Erreur récupération location:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ ACTIVER une location (quand le contrat est signé)
const activerLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { contrat_url } = req.body;

    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location non trouvée' });
    }

    if (location.statut !== 'en_attente') {
      return res.status(400).json({ 
        error: `La location ne peut être activée. Statut actuel: ${location.statut}`
      });
    }

    // Mettre à jour la location
    const locationUpdate = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        statut: 'en_cours',
        contrat_url: contrat_url || location.contrat_url
      },
      include: {
        maison: true,
        utilisateur: true
      }
    });

    // Mettre à jour le statut de la maison
    await prisma.maison.update({
      where: { id: location.maison_id },
      data: { 
        statut: 'loue',
        est_louee: true 
      }
    });

    res.json({
      message: 'Location activée avec succès',
      data: locationUpdate
    });

  } catch (error) {
    console.error('Erreur activation location:', error);
    res.status(400).json({ error: error.message });
  }
};

// 💰 ENREGISTRER un paiement
const enregistrerPaiement = async (req, res) => {
  try {
    const { id } = req.params;
    const { montant } = req.body;

    if (!montant) {
      return res.status(400).json({ error: 'Le montant est requis' });
    }

    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location non trouvée' });
    }

    // Calculer les nouveaux totaux
    const nouveauTotalPaye = parseFloat(location.total_paye) + parseFloat(montant);
    const nouveauSolde = parseFloat(location.solde_restant) - parseFloat(montant);

    // Mettre à jour la location
    const locationUpdate = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        total_paye: nouveauTotalPaye,
        solde_restant: nouveauSolde > 0 ? nouveauSolde : 0
      },
      include: {
        maison: true,
        utilisateur: true
      }
    });

    res.json({
      message: 'Paiement enregistré avec succès',
      data: locationUpdate
    });

  } catch (error) {
    console.error('Erreur enregistrement paiement:', error);
    res.status(400).json({ error: error.message });
  }
};

// 🔚 TERMINER une location
const terminerLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) },
      include: { maison: true }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location non trouvée' });
    }

    // Mettre à jour la location
    const locationUpdate = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        statut: 'termine'
      }
    });

    // Libérer la maison
    await prisma.maison.update({
      where: { id: location.maison_id },
      data: { 
        statut: 'disponible',
        est_louee: false 
      }
    });

    res.json({
      message: 'Location terminée avec succès',
      data: locationUpdate
    });

  } catch (error) {
    console.error('Erreur terminaison location:', error);
    res.status(400).json({ error: error.message });
  }
};

// ❌ RÉSILIER une location
const resilierLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) },
      include: { maison: true }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location non trouvée' });
    }

    // Mettre à jour la location
    const locationUpdate = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        statut: 'resilie'
      }
    });

    // Libérer la maison
    await prisma.maison.update({
      where: { id: location.maison_id },
      data: { 
        statut: 'disponible',
        est_louee: false 
      }
    });

    res.json({
      message: 'Location résiliée avec succès',
      data: locationUpdate
    });

  } catch (error) {
    console.error('Erreur résiliation location:', error);
    res.status(400).json({ error: error.message });
  }
};

// 📊 STATISTIQUES simples
const getStatsLocations = async (req, res) => {
  try {
    const stats = await prisma.location.groupBy({
      by: ['statut'],
      _count: {
        id: true
      },
      _sum: {
        loyer_mensuel: true,
        total_paye: true
      }
    });

    const totalLocations = await prisma.location.count();
    const totalLoyerMensuel = await prisma.location.aggregate({
      _sum: { loyer_mensuel: true },
      where: { statut: 'en_cours' }
    });

    res.json({
      total_locations: totalLocations,
      total_loyer_mensuel_en_cours: totalLoyerMensuel._sum.loyer_mensuel || 0,
      par_statut: stats.map(stat => ({
        statut: stat.statut,
        nombre: stat._count.id,
        loyer_total: stat._sum.loyer_mensuel,
        total_paye: stat._sum.total_paye
      }))
    });

  } catch (error) {
    console.error('Erreur statistiques locations:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createLocation,
  getLocations,
  getLocationById,
  activerLocation,
  enregistrerPaiement,
  terminerLocation,
  resilierLocation,
  getStatsLocations
};