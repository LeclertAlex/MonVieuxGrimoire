const Book = require('../mongoose-models/Book');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const isCreator = require('../middleware/isCreator');

// Créer un livre avec une note initiale facultative
exports.createBook = async (req, res) => {
  try {
    const userId = req.userId; // ID de l'utilisateur connecté
    if (!userId) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    let { title, author, year, genre, rating } = req.body;

    // Si les données du livre sont envoyées sous forme de chaîne JSON
    if (req.body.book) {
      const bookData = JSON.parse(req.body.book);
      title = bookData.title;
      author = bookData.author;
      year = bookData.year;
      genre = bookData.genre;
      rating = bookData.rating || 0;
    }

    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : req.body.imageUrl;

    if (!title || !author || !imageUrl || !year || !genre) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const newBook = new Book({
      title,
      author,
      year,
      genre,
      imageUrl,
      creator: userId,
    });

    // Ajouter la note initiale si elle est valide
    const ratingValue = parseInt(rating, 10);
    if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
      newBook.ratings.push({ userId, grade: ratingValue });
      newBook.averageRating = ratingValue;
    }

    await newBook.save();

    // Renvoyer le livre créé avec les virtuals appliqués
    res.status(201).json(newBook.toObject({ virtuals: true }));
  } catch (error) {
    console.error("Erreur lors de la création du livre :", error.message);
    res.status(500).json({ message: "Erreur lors de la création du livre." });
  }
};


// Récupérer tous les livres et inclure averageRating et creator dans chaque livre
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().lean({ virtuals: true });

    // Convertir `creator` pour chaque livre en chaîne de caractères
    const transformedBooks = books.map(book => ({
      ...book,
      creator: book.creator.toString(),
    }));

    console.log("Liste des livres après transformation :", transformedBooks); // Log pour vérifier
    res.status(200).json(transformedBooks);
  } catch (error) {
    console.error('Erreur lors de la récupération des livres :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// Récupérer un livre par ID
exports.getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;

    // Vérifiez si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: 'ID invalide.' });
    }

    // Trouver le livre par son ID
    const book = await Book.findById(bookId).lean({ virtuals: true });

    // Si le livre n'existe pas
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Transformez `creator` en `userId` pour le frontend
    book.userId = book.creator.toString();
    delete book.creator; // Supprimez le champ `creator` si non nécessaire pour éviter la confusion

    console.log("Détails du livre après transformation :", book);

    // Envoyez la réponse avec le champ `userId`
    res.status(200).json(book);
  } catch (error) {
    console.error("Erreur lors de la récupération du livre :", error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// Ajouter une note à un livre (noteurs, éviter les doublons. Si un utilisateur a déjà noté, sa note est mise à jour.)
exports.rateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.userId; // Supposant que `userId` est extrait d'un middleware d'authentification
    const { rating } = req.body;

    // Vérifications
    if (!bookId || bookId === 'undefined' || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: 'ID du livre invalide ou manquant.' });
    }

    const ratingValue = parseInt(rating, 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: 'Note invalide. Elle doit être un nombre entre 1 et 5.' });
    }

    // Rechercher le livre
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Vérifier si l'utilisateur a déjà noté le livre
    const existingRatingIndex = book.ratings.findIndex((r) => r.userId.toString() === userId);

    if (existingRatingIndex !== -1) {
      // Mettre à jour la note existante
      book.ratings[existingRatingIndex].grade = ratingValue;
    } else {
      // Ajouter une nouvelle note
      book.ratings.push({ userId, grade: ratingValue });
    }

    // Recalculer la moyenne des notes
    const totalRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
    book.averageRating = totalRatings / book.ratings.length;

    await book.save();

    // Renvoyer le livre mis à jour avec les virtuals appliqués
    res.status(200).json(book.toObject({ virtuals: true }));
  } catch (error) {
    console.error("Erreur lors de l'ajout ou mise à jour de la note :", error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


//misse a jours 
exports.updateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.userId; // Extrait de l'authentification (middleware)

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: 'ID du livre invalide ou manquant.' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé' });
    }

    if (book.creator.toString() !== userId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce livre." });
    }

    const { title, author, year, genre } = req.body;

    // Mise à jour des champs
    if (title) book.title = title;
    if (author) book.author = author;
    if (year) book.year = year;
    if (genre) book.genre = genre;

    // Gestion de l'image
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (book.imageUrl && book.imageUrl.startsWith(`${req.protocol}://${req.get('host')}/uploads/`)) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', path.basename(book.imageUrl));
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Erreur lors de la suppression de l'image :", err.message);
        });
      }
      book.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    console.log("updateBook - req.body :", req.body);
    console.log("updateBook - req.file :", req.file);
    console.log("updateBook - book avant mise à jour :", book);


    await book.save();

    // Renvoyer le livre mis à jour avec les virtuals appliqués
    res.status(200).json(book.toObject({ virtuals: true }));
  } catch (error) {
    console.error("Erreur lors de la mise à jour du livre :", error.message);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du livre.' });
  }
};


// Supprimer un livre (uniquement par le créateur)
exports.deleteBook = async (req, res) => {
  try {
    const book = req.book; // Livre injecté par le middleware isCreator

    console.log("ID du livre à supprimer :", book._id);
    console.log("Titre du livre :", book.title);

    // Suppression de l'image associée si nécessaire
    if (book.imageUrl && book.imageUrl.startsWith(`${req.protocol}://${req.get('host')}/uploads/`)) {
      const imagePath = path.join(__dirname, '..', 'uploads', path.basename(book.imageUrl));
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Erreur lors de la suppression de l'image :", err.message);
        } else {
          console.log("Image supprimée :", imagePath);
        }
      });
    }

    // Supprimer le livre
    await book.deleteOne();

    res.status(200).json({ message: 'Livre supprimé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la suppression du livre :", error.message);
    res.status(500).json({ message: 'Erreur lors de la suppression du livre.' });
  }
};

// Récupérer les livres avec la meilleure note
exports.getBestRatedBooks = async (req, res) => {
  try {
    console.log("Récupération des livres avec la meilleure note...");
    const books = await Book.find().sort({ averageRating: -1 }).limit(5).lean({ virtuals: true });

    if (!books || books.length === 0) {
      return res.status(404).json({ message: 'Aucun livre trouvé avec une note.' });
    }

    // Convertir `creator` pour chaque livre en chaîne de caractères
    const transformedBooks = books.map(book => ({
      ...book,
      creator: book.creator.toString(),
    }));

    console.log("Livres récupérés après transformation :", transformedBooks); // Log pour vérifier
    res.status(200).json(transformedBooks);
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
    let books = JSON.parse(booksData);

    // Si les livres ont un champ '_id', transformer pour ajouter 'id'
    books = books.map(book => {
      // Supprimer les IDs des notes si nécessaire
      if (book.ratings && book.ratings.length > 0) {
        book.ratings = book.ratings.map(rating => {
          return {
            ...rating,
            id: rating._id ? rating._id.toString() : undefined,
            _id: undefined,
          };
        });
      }

      return {
        ...book,
        id: book._id ? book._id.toString() : undefined,
        _id: undefined,
      };
    });

    res.status(200).json(books);
  } catch (error) {
    console.error("Erreur lors de la récupération des livres depuis JSON :", error.message);
    res.status(500).json({ message: "Erreur lors de la récupération des livres." });
  }
};