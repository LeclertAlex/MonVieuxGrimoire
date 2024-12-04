const Book = require('../mongoose-models/Book');

const isCreator = async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const userId = req.userId;

    console.log("isCreator - bookId :", bookId);
    console.log("isCreator - userId :", userId);

    if (!bookId || !userId) {
      return res.status(400).json({ message: 'ID du livre ou utilisateur manquant.' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    console.log("isCreator - book.creator :", book.creator.toString());
    if (book.creator.toString() !== userId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier ce livre." });
    }

    req.book = book;
    next();
  } catch (error) {
    console.error("Erreur dans isCreator :", error.message);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


module.exports = isCreator;
