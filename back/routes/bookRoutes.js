const express = require('express');
const multer = require('multer');
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');

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
router.get('/bestrating', bookController.getBestRatedBooks); // Cette route doit venir avant /:id
router.get('/fromjson', bookController.getBooksFromJson);

// Routes pour les livres
router.post('/', auth, upload.single('image'), bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.put('/:id', auth, upload.single('image'), bookController.updateBook);
router.delete('/:id', auth, bookController.deleteBook);
router.post('/:id/rating', auth, bookController.rateBook);

module.exports = router;
