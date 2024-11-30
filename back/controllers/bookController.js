const Book = require('../mongoose-models/Book');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Créer un livre avec une note initiale facultative
exports.createBook = async (req, res) => {
  try {
    console.log("Contenu complet de req.body :", req.body);
    console.log("Contenu de req.file :", req.file);

    const userId = req.userId; // ID de l'utilisateur connecté, extrait du token JWT
    if (!userId) {
      console.log("Utilisateur non authentifié");
      return res.status(401).json({ message: "Authentification requise." });
    }

    // Extraire les données du livre
    let title, author, year, genre, initialGrade;
    if (req.body.book) {
      try {
        const bookData = JSON.parse(req.body.book);
        title = bookData.title;
        author = bookData.author;
        year = bookData.year;
        genre = bookData.genre;
        initialGrade = bookData.ratings && bookData.ratings[0] ? bookData.ratings[0].grade : null;
      } catch (parseError) {
        console.error("Erreur lors du parsing des données du livre :", parseError.message);
        return res.status(400).json({ message: "Données du livre invalides." });
      }
    } else {
      title = req.body.title;
      author = req.body.author;
      year = req.body.year;
      genre = req.body.genre;
      initialGrade = req.body.ratings && req.body.ratings[0] ? req.body.ratings[0].grade : null;
    }

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : req.body.imageUrl;

    if (!title || !author || !imageUrl) {
      return res.status(400).json({ message: "Les champs title, author et imageUrl sont requis." });
    }

    // Création du livre avec une note initiale si fournie
    let ratings = [];
    let averageRating = 0;

    if (initialGrade) {
      const ratingValue = parseInt(initialGrade, 10);
      if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
        ratings.push({ userId: new mongoose.Types.ObjectId(userId), grade: ratingValue });
        averageRating = ratingValue;
      }
    }

    // Création du livre avec le champ `creator`
    const book = new Book({
      title,
      author,
      year,
      genre,
      imageUrl,
      ratings,
      averageRating,
      creator: new mongoose.Types.ObjectId(userId) // Assurez-vous d'utiliser `new` ici
    });

    await book.save();
    res.status(201).json(book);

  } catch (error) {
    console.error("Erreur lors de la création du livre :", error.message);
    res.status(500).json({ message: "Erreur lors de la création du livre." });
  }
};



// Récupérer tous les livres et inclure averageRating et creator dans chaque livre
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();

    const formattedBooks = books.map(book => ({
      ...book._doc,
      id: book._id,
      userId: book.creator ? book.creator.toString() : null, // Ajout de userId basé sur creator
      imageUrl: book.imageUrl.startsWith('http')
        ? book.imageUrl
        : `${req.protocol}://${req.get('host')}${book.imageUrl}`,
    }));
    
    res.status(200).json(formattedBooks);    
  } catch (error) {
    console.error("Erreur lors de la récupération des livres :", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des livres." });
  }
};

// Récupérer un livre par ID
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }
    res.status(200).json({ 
      ...book._doc, 
      id: book._id,
      userId: book.creator ? book.creator.toString() : null, // Ajout de userId basé sur creator
      imageUrl: book.imageUrl.startsWith('http') 
        ? book.imageUrl 
        : `${req.protocol}://${req.get('host')}${book.imageUrl}`,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du livre :", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération du livre." });
  }
};

// Ajouter une note à un livre (sans restriction pour le créateur)
exports.rateBook = async (req, res) => {
  try {
    const { rating } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    const ratingValue = parseInt(rating, 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    // Vérifiez si l'utilisateur a déjà noté ce livre
    const existingRating = book.ratings.find(ratingObj => ratingObj.userId.toString() === userId.toString());
    if (existingRating) {
      existingRating.grade = ratingValue; // Met à jour la note existante
    } else {
      book.ratings.push({ userId: new mongoose.Types.ObjectId(userId), grade: ratingValue }); // Ajoute une nouvelle note
    }

    // Calcul de la nouvelle moyenne
    const totalGrades = book.ratings.reduce((acc, curr) => acc + curr.grade, 0);
    book.averageRating = parseFloat((totalGrades / book.ratings.length).toFixed(1));

    await book.save();
    res.status(200).json(book);

  } catch (error) {
    console.error("Erreur lors de l'ajout de la note au livre :", error.message);
    res.status(500).json({ message: "Erreur lors de l'ajout de la note au livre." });
  }
};

exports.updateBook = async (req, res) => {
  try {
    console.log("ID du livre à mettre à jour :", req.params.id);
    console.log("Contenu de req.body :", req.body);
    console.log("Contenu de req.file :", req.file);

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    // Log après avoir trouvé le livre
    console.log("ID du créateur du livre :", book.creator.toString());
    console.log("ID de l'utilisateur connecté :", req.userId);

    // Vérifiez que l'utilisateur est le créateur du livre
    if (book.creator.toString() !== req.userId) {
      return res.status(403).json({ message: "Seul le créateur peut mettre à jour ce livre." });
    }

    // Mettre à jour les champs modifiables
    book.title = req.body.title || book.title;
    book.author = req.body.author || book.author;
    book.year = req.body.year || book.year;
    book.genre = req.body.genre || book.genre;

    // Si une nouvelle image est téléchargée
    if (req.file) {
      // Supprimer l'ancienne image si elle existe et n'est pas une URL externe
      if (book.imageUrl && !book.imageUrl.startsWith('http')) {
        const oldImagePath = path.join(__dirname, '..', book.imageUrl);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Erreur lors de la suppression de l'ancienne image :", err.message);
          } else {
            console.log("Ancienne image supprimée :", oldImagePath);
          }
        });
      }
      book.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await book.save();
    console.log("Livre mis à jour avec succès :", book);
    res.status(200).json({ 
      ...book._doc, 
      id: book._id,
      imageUrl: book.imageUrl.startsWith('http') 
        ? book.imageUrl 
        : `${req.protocol}://${req.get('host')}${book.imageUrl}`,
      creator: book.creator ? book.creator.toString() : null
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du livre :", error.message);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du livre.' });
  }
};



// Supprimer un livre (uniquement par le créateur)
exports.deleteBook = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    // Vérifiez si l'utilisateur est le créateur du livre
    if (book.creator.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Seul le créateur peut supprimer ce livre." });
    }

    // Supprimer l'image associée si nécessaire
    if (book.imageUrl && !book.imageUrl.startsWith('http')) {
      const imagePath = path.join(__dirname, '..', book.imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Erreur lors de la suppression de l'image :", err.message);
        }
      });
    }

    await book.deleteOne();
    res.status(200).json({ message: 'Livre supprimé' });

  } catch (error) {
    console.error("Erreur lors de la suppression du livre :", error.message);
    res.status(500).json({ message: 'Erreur lors de la suppression du livre.' });
  }
};

// Récupérer les livres avec la meilleure note
exports.getBestRatedBooks = async (req, res) => {
  try {
    console.log("Récupération des livres avec la meilleure note...");
    const books = await Book.find().sort({ averageRating: -1 }).limit(5);
    if (!books || books.length === 0) {
      return res.status(404).json({ message: 'Aucun livre trouvé avec une note.' });
    }
    console.log("Livres récupérés :", books);
    res.status(200).json(books);
  } catch (error) {
    console.error("Erreur lors de la récupération des livres avec la meilleure note :", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des livres." });
  }
};


// Récupérer les livres depuis un fichier JSON
exports.getBooksFromJson = (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/books.json');
    const booksData = fs.readFileSync(filePath, 'utf8');
    const books = JSON.parse(booksData);
    res.status(200).json(books);
  } catch (error) {
    console.error("Erreur lors de la récupération des livres depuis JSON :", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des livres." });
  }
};
