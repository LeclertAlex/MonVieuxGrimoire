const express = require('express');
const multer = require('multer');
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');
const isCreator = require('../middleware/isCreator');

const router = express.Router();

// Configuration de Multer pour le téléchargement des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite à 2MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const mimeType = fileTypes.test(file.mimetype);
    const extName = fileTypes.test(file.originalname.split('.').pop().toLowerCase());
    if (mimeType && extName) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés (JPEG, PNG, GIF).'));
    }
  }
});

// Middleware pour loguer les requêtes spécifiques aux livres
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

// Routes spécifiques avant les routes dynamiques
router.get('/bestrating', logRequest, bookController.getBestRatedBooks); // Récupérer les meilleurs livres
router.get('/fromjson', logRequest, bookController.getBooksFromJson); // Charger des livres depuis un fichier JSON

// CRUD des livres
router.post('/', auth, upload.single('image'), logRequest, bookController.createBook); // Créer un livre
router.get('/', logRequest, bookController.getAllBooks); // Liste des livres
router.get('/:id', logRequest, bookController.getBookById); // Détails d'un livre
router.put('/:id', auth, isCreator, upload.single('image'), logRequest, bookController.updateBook); // Mettre à jour un livre
router.delete('/:id', auth, isCreator, logRequest, bookController.deleteBook); // Supprimer un livre

// Gestion des notes
router.post('/:id/rating', auth, logRequest, bookController.rateBook); // Ajouter ou mettre à jour une note

module.exports = router;

// Loguer les types des middlewares et des contrôleurs (facultatif pour débogage)
console.log('auth:', typeof auth);
console.log('isCreator:', typeof isCreator);
console.log('upload:', typeof upload);
console.log('bookController.updateBook:', typeof bookController.updateBook);
