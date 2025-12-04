const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads/parcelles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de multer pour le stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'parcelle-' + uniqueSuffix + extension);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5 // Maximum 5 fichiers
  }
});

// Middleware pour gérer multiple fichiers
const uploadImages = upload.array('images', 5);

// Middleware pour parser FormData
const handleFormData = (req, res, next) => {
  uploadImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    // Si des fichiers sont uploadés, créer un tableau d'URLs
    if (req.files && req.files.length > 0) {
      req.imageUrls = req.files.map(file => 
        `/uploads/parcelles/${file.filename}`
      );
    }
    
    next();
  });
};

module.exports = {
  handleFormData,
  upload
};