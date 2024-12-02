const express = require('express');
const multer = require('multer');
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');
const isCreator = require('../middleware/Creator-Validation');

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
  limits: { fileSize: 2 * 1024 * 1024 },
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

// Routes spécifiques avant les routes dynamiques
router.get('/bestrating', bookController.getBestRatedBooks); // Récupérer les meilleurs livres
router.get('/fromjson', bookController.getBooksFromJson); // Charger des livres depuis un fichier JSON

// CRUD des livres
router.post('/', auth, upload.single('image'), bookController.createBook); // Créer un livre
router.get('/', bookController.getAllBooks); // Liste des livres
router.get('/:id', bookController.getBookById); // Détails d'un livre
router.put('/:id', auth, upload.single('image'), bookController.updateBook); // Mettre à jour un livre
router.delete('/:id', auth, bookController.deleteBook); // Supprimer un livre

// Gestion des notes
router.post('/:id/rating', auth, bookController.rateBook); // Ajouter ou mettre à jour une note

module.exports = router;
