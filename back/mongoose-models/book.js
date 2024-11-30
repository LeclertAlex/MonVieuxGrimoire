const mongoose = require('mongoose');

// Schéma pour la notation d'un livre
const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: Number, required: true, min: 1, max: 5 }
});

// Schéma pour le livre
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  imageUrl: { type: String, required: true },
  averageRating: { type: Number, default: 0 },
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      grade: { type: Number, required: true }
    }
  ],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});



// Middleware pour calculer la note moyenne avant sauvegarde
bookSchema.pre('save', function (next) {
  if (this.ratings.length > 0) {
    const totalRatings = this.ratings.reduce((acc, rating) => acc + rating.grade, 0);
    this.averageRating = totalRatings / this.ratings.length;
  } else {
    this.averageRating = 0; // Par défaut si pas de notes
  }
  next();
});

// Méthode statique pour ajouter ou mettre à jour une note
bookSchema.statics.addOrUpdateRating = async function (bookId, userId, grade) {
  const book = await this.findById(bookId);
  if (!book) {
    throw new Error("Livre non trouvé");
  }

  // Vérifiez si l'utilisateur a déjà noté ce livre
  const existingRating = book.ratings.find(rating => rating.userId.toString() === userId.toString());
  if (existingRating) {
    existingRating.grade = grade; // Met à jour la note existante
  } else {
    book.ratings.push({ userId, grade }); // Ajoute une nouvelle note
  }

  // Calcul de la nouvelle moyenne (automatiquement pris en charge par le middleware `pre('save')`)
  await book.save();
  return book;
};

// Exporter le modèle Book
module.exports = mongoose.model('Book', bookSchema);
