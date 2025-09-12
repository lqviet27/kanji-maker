const mongoose = require('mongoose');

const KanjiSchema = new mongoose.Schema({
  kanji: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hanViet: {
    type: String,
    required: true
  },
  meaning: {
    type: String,
    required: true
  },
  onyomi: {
    type: String,
    required: true
  },
  kunyomi: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
KanjiSchema.index({ kanji: 1 });

module.exports = mongoose.model('Kanji', KanjiSchema);