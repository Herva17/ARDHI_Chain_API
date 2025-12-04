// middleware/uploadMaison.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Constantes de configuration
const CONFIG = {
  MAISON: {
    UPLOAD_DIR: 'uploads/maisons',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 10,
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  },
  PARCELLE: {
    UPLOAD_DIR: 'uploads/parcelles',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 5
  }
};

// Créer les dossiers uploads s'ils n'existent pas
Object.values(CONFIG).forEach(config => {
  if (!fs.existsSync(config.UPLOAD_DIR)) {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
    console.log(`📁 Dossier créé: ${config.UPLOAD_DIR}`);
  }
});

// Fonction pour générer un nom de fichier unique
const generateFileName = (prefix, originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName).toLowerCase();
  return `${prefix}-${timestamp}-${random}${extension}`;
};

// ==================== CONFIGURATION MULTER POUR MAISONS ====================

const maisonStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CONFIG.MAISON.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const filename = generateFileName('maison', file.originalname);
    cb(null, filename);
  }
});

// Filtre de validation pour les images de maisons
const maisonFileFilter = (req, file, cb) => {
  // Vérifier le type MIME
  if (CONFIG.MAISON.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // Vérifier l'extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (CONFIG.MAISON.ALLOWED_EXTENSIONS.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`Extension non autorisée: ${extension}. Extensions autorisées: ${CONFIG.MAISON.ALLOWED_EXTENSIONS.join(', ')}`), false);
    }
  } else {
    cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Types autorisés: ${CONFIG.MAISON.ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

// Configuration Multer pour les maisons
const uploadMaison = multer({
  storage: maisonStorage,
  fileFilter: maisonFileFilter,
  limits: {
    fileSize: CONFIG.MAISON.MAX_FILE_SIZE,
    files: CONFIG.MAISON.MAX_FILES
  }
}).array('images', CONFIG.MAISON.MAX_FILES);

// ==================== CONFIGURATION MULTER POUR PARCELLES ====================

const parcelleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CONFIG.PARCELLE.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const filename = generateFileName('parcelle', file.originalname);
    cb(null, filename);
  }
});

// Filtre de validation pour les images de parcelles
const parcelleFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées pour les parcelles!'), false);
  }
};

// Configuration Multer pour les parcelles
const uploadParcelle = multer({
  storage: parcelleStorage,
  fileFilter: parcelleFileFilter,
  limits: {
    fileSize: CONFIG.PARCELLE.MAX_FILE_SIZE,
    files: CONFIG.PARCELLE.MAX_FILES
  }
}).array('images', CONFIG.PARCELLE.MAX_FILES);

// ==================== MIDDLEWARES PRINCIPAUX ====================

/**
 * Middleware pour gérer l'upload d'images de maisons
 * Gère FormData avec fichiers images
 */
const handleMaisonFormData = (req, res, next) => {
  console.log('🔄 Middleware upload maison - Content-Type:', req.headers['content-type']);
  
  // Vérifier si c'est du FormData
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    console.log('📝 Pas de FormData, traitement JSON normal');
    req.imageUrls = [];
    return next();
  }
  
  uploadMaison(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload maison:', err.message);
      
      // Gestion spécifique des erreurs Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `Fichier trop volumineux. Taille max: ${CONFIG.MAISON.MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: `Trop de fichiers. Maximum: ${CONFIG.MAISON.MAX_FILES} fichiers`
        });
      }
      
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: 'Champ de fichier incorrect. Utilisez "images" comme nom de champ'
        });
      }
      
      return res.status(400).json({ error: err.message });
    }
    
    // Log des fichiers uploadés
    if (req.files && req.files.length > 0) {
      console.log(`✅ ${req.files.length} fichier(s) uploadé(s) pour la maison`);
      
      // Créer les URLs d'accès
      req.imageUrls = req.files.map(file => ({
        url: `/uploads/maisons/${file.filename}`,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        filename: file.filename
      }));
      
      console.log('📸 URLs d\'images générées:', req.imageUrls.map(img => img.url));
    } else {
      req.imageUrls = [];
      console.log('📭 Aucun fichier uploadé');
    }
    
    // Parser les champs texte du FormData
    if (req.body) {
      console.log('📋 Champs texte reçus:', Object.keys(req.body));
      
      // Convertir les valeurs booléennes
      const booleanFields = ['jardin', 'garage', 'piscine'];
      booleanFields.forEach(field => {
        if (req.body[field] !== undefined) {
          req.body[field] = req.body[field] === 'true' || req.body[field] === true || req.body[field] === '1';
        }
      });
      
      // Convertir les valeurs numériques
      const numericFields = [
        'nombre_chambres', 'nombre_salles_bain', 'surface_totale',
        'prix_vente', 'prix_location', 'parcelle_id'
      ];
      numericFields.forEach(field => {
        if (req.body[field] && !isNaN(req.body[field])) {
          req.body[field] = Number(req.body[field]);
        }
      });
    }
    
    next();
  });
};

/**
 * Middleware pour gérer l'upload d'images de parcelles
 * Compatible avec l'existant
 */
const handleParcelleFormData = (req, res, next) => {
  console.log('🔄 Middleware upload parcelle');
  
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    req.imageUrls = [];
    return next();
  }
  
  uploadParcelle(req, res, (err) => {
    if (err) {
      console.error('❌ Erreur upload parcelle:', err.message);
      return res.status(400).json({ error: err.message });
    }
    
    if (req.files && req.files.length > 0) {
      req.imageUrls = req.files.map(file => 
        `/uploads/parcelles/${file.filename}`
      );
      console.log(`✅ ${req.files.length} image(s) uploadée(s) pour la parcelle`);
    } else {
      req.imageUrls = [];
    }
    
    next();
  });
};

/**
 * Middleware simple pour FormData (pour tests)
 * Parse manuellement les données sans upload
 */
const simpleFormDataParser = (req, res, next) => {
  console.log('🔄 Simple FormData Parser');
  
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }
  
  let rawData = Buffer.from('');
  
  req.on('data', chunk => {
    rawData = Buffer.concat([rawData, chunk]);
  });
  
  req.on('end', () => {
    try {
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (!boundaryMatch) {
        console.log('⚠️  Boundary non trouvé, skip parsing');
        return next();
      }
      
      const boundary = '--' + boundaryMatch[1];
      const parts = rawData.toString().split(boundary);
      
      req.body = {};
      req.imageUrls = [];
      
      parts.forEach(part => {
        if (part.includes('Content-Disposition')) {
          const nameMatch = part.match(/name="([^"]+)"/);
          
          if (nameMatch) {
            const fieldName = nameMatch[1];
            
            // Si c'est un champ fichier
            if (part.includes('filename="')) {
              const filenameMatch = part.match(/filename="([^"]+)"/);
              if (filenameMatch) {
                console.log(`📁 Fichier détecté: ${filenameMatch[1]} (simulé)`);
                // Simuler une URL d'image
                req.imageUrls.push(`/uploads/simulated/${Date.now()}-${filenameMatch[1]}`);
              }
            } else {
              // Champ texte
              const valueMatch = part.match(/\r\n\r\n([\s\S]*?)\r\n/);
              if (valueMatch) {
                const value = valueMatch[1].trim();
                req.body[fieldName] = value;
                console.log(`📝 ${fieldName}: ${value.substring(0, 50)}...`);
              }
            }
          }
        }
      });
      
      console.log('✅ Parsing FormData simple terminé');
      console.log('📦 Champs texte:', Object.keys(req.body));
      console.log('📸 URLs simulées:', req.imageUrls.length);
      
      next();
    } catch (error) {
      console.error('❌ Erreur parsing simple:', error);
      next();
    }
  });
  
  // Empêcher le double parsing
  req._read = req.read;
  req.read = function() {
    return null;
  };
};

/**
 * Middleware pour nettoyer les fichiers uploadés en cas d'erreur
 */
const cleanupUploadsOnError = (req, res, next) => {
  // Sauvegarder la fonction send originale
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Intercepter les réponses d'erreur
  res.send = function(body) {
    if (res.statusCode >= 400 && req.files && req.files.length > 0) {
      console.log('🧹 Nettoyage des fichiers uploadés suite à erreur...');
      req.files.forEach(file => {
        const filePath = path.join(file.destination, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Fichier supprimé: ${file.filename}`);
        }
      });
    }
    originalSend.call(this, body);
  };
  
  res.json = function(body) {
    if (res.statusCode >= 400 && req.files && req.files.length > 0) {
      console.log('🧹 Nettoyage des fichiers uploadés suite à erreur...');
      req.files.forEach(file => {
        const filePath = path.join(file.destination, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Fichier supprimé: ${file.filename}`);
        }
      });
    }
    originalJson.call(this, body);
  };
  
  next();
};

/**
 * Middleware pour servir les fichiers uploadés statiquement
 * À ajouter dans votre app.js : app.use('/uploads', serveUploads)
 */
const serveUploads = (req, res, next) => {
  const filePath = path.join(__dirname, '..', req.path);
  
  if (fs.existsSync(filePath)) {
    // Définir les headers de sécurité
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
    
    // Servir le fichier
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Fichier non trouvé' });
  }
};

// ==================== FONCTIONS UTILITAIRES ====================

/**
 * Supprime les fichiers d'une maison lors de sa suppression
 * @param {Array} imageUrls - URLs des images à supprimer
 */
const deleteMaisonImages = (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls)) return;
  
  imageUrls.forEach(image => {
    if (typeof image === 'string' && image.includes('/uploads/maisons/')) {
      const filename = image.split('/').pop();
      const filePath = path.join(CONFIG.MAISON.UPLOAD_DIR, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Image supprimée: ${filename}`);
      }
    } else if (image && image.url) {
      const filename = image.url.split('/').pop();
      const filePath = path.join(CONFIG.MAISON.UPLOAD_DIR, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Image supprimée: ${filename}`);
      }
    }
  });
};

/**
 * Supprime les fichiers d'une parcelle
 * @param {Array} imageUrls - URLs des images à supprimer
 */
const deleteParcelleImages = (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls)) return;
  
  imageUrls.forEach(image => {
    if (typeof image === 'string' && image.includes('/uploads/parcelles/')) {
      const filename = image.split('/').pop();
      const filePath = path.join(CONFIG.PARCELLE.UPLOAD_DIR, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Image parcelle supprimée: ${filename}`);
      }
    }
  });
};

// ==================== EXPORT ====================

module.exports = {
  // Middlewares principaux
  handleMaisonFormData,
  handleParcelleFormData,
  simpleFormDataParser,
  cleanupUploadsOnError,
  serveUploads,
  
  // Fonctions utilitaires
  deleteMaisonImages,
  deleteParcelleImages,
  
  // Configurations
  CONFIG,
  
  // Pour compatibilité
  upload: uploadParcelle, // Export par défaut pour les parcelles
  handleFormData: handleParcelleFormData // Alias pour compatibilité
};