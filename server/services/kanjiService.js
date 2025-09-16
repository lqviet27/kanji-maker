const Kanji = require('../models/Kanji');
const { getKanjiDetailsFromAI } = require('./aiService');

const getKanjiDetailsFromDB = async (kanjiList) => {
  try {
    const results = await Kanji.find({ kanji: { $in: kanjiList } });
    
    const resultMap = new Map(results.map(item => {
      const onyomi = item.onyomi === 'none' ? 'Không có âm on' : item.onyomi;
      const kunyomi = item.kunyomi === 'none' ? 'Không có âm kun' : item.kunyomi;
      item.onyomi = onyomi;
      item.kunyomi = kunyomi;
      item.hanViet = item.hanViet.toUpperCase();
      return [item.kanji, item];
    }));
    resultMap.forEach((value, key) => {
      console.log(`${key}: ${value._id}`);
    });
    const orderedResults = kanjiList.map(kanji => resultMap.get(kanji) || null);

    const missingKanji = kanjiList.filter((kanji, index) => orderedResults[index] === null);
    
    if (missingKanji.length > 0) {
      console.log(`Không tìm thấy ${missingKanji.length} kanji trong DB, đang gọi AI để lấy dữ liệu...`);
      const aiResults = await getKanjiDetailsFromAI(missingKanji);
      for (const item of aiResults) {
        const newKanji = new Kanji(item);
        await newKanji.save();
      }
      let aiIndex = 0;
      for (let i = 0; i < orderedResults.length; i++) {
        if (orderedResults[i] === null) {
          orderedResults[i] = aiResults[aiIndex++];
        }
      }
    }

    console.log(`Tổng số kanji tìm thấy: ${orderedResults.length}`);
    return orderedResults;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu từ DB:', error);
    throw error;
  }
};

module.exports = {
  getKanjiDetailsFromDB
}; 