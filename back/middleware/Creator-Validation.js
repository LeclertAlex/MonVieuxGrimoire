exports.isCreator = async (req, res, next) => {
    try {
      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }
  
      if (book.creator.toString() !== req.userId) {
        return res.status(403).json({ message: "Accès interdit : vous n'êtes pas le créateur de ce livre." });
      }
  
      req.book = book; // Injecter le livre dans la requête pour un accès simplifié
      next();
    } catch (error) {
      console.error("Erreur lors de la vérification du créateur :", error.message);
      res.status(500).json({ message: 'Erreur serveur.' });
    }
  };