const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
// Schéma pour la notation d'un livre
const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: Number, required: true, min: 1, max: 5 },
});

// Ajouter un champ virtuel `id` pour les ratings
ratingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ratingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false, // Supprime le champ `__v`
  transform: function (doc, ret) {
    delete ret._id;
  },
});

// Schéma pour le livre
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  imageUrl: { type: String, required: true },
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      grade: { type: Number, required: true },
    },
  ], // Tableau de notations
  averageRating: { type: Number, default: 0 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Créateur
});

// Ajouter le champ virtuel `id` qui contient la valeur de `_id`
bookSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Configurer `toJSON` pour inclure les virtuels et supprimer les champs indésirables
bookSchema.set('toJSON', {
  virtuals: true,
  versionKey: false, // Supprime le champ 
  transform: function (doc, ret) {
    ret.id = ret._id.toString(); 
    ret.creator = ret.creator ? ret.creator.toString() : null; // Convertir `creator` en string
    delete ret._id; // Supprimer `_id` pour éviter la confusion avec `id`
  },
});

module.exports = mongoose.model('Book', bookSchema);
