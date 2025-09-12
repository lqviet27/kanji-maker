require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const { getKanjiDetailsFromAI } = require('../services/aiService');
const Kanji = require('../models/Kanji');
const config = require('../config/config');
// Kết nối DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kanjiDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected for precompute'))
  .catch(err => console.error('MongoDB error:', err));

const CSV_FILE_PATH = '../kanji_data_set/joyo_kanji.csv'; 

async function precompute() {
  try {
    // Bước 1: Đọc và parse CSV để lấy list unique kanji từ cột 'new'
    const allKanji = new Set();
    
    const MAX_KANJI = 500; 
    let count = 0;
    let isHeader = true; 
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => {
          if (isHeader) {
            isHeader = false; 
            return;
          }
          if (row.new && row.new.trim()) {
            allKanji.add(row.new.trim());
          }
        })
        .on('end', () => {
          console.log(`Đã đọc file CSV: Tìm thấy ${allKanji.size} kanji (giới hạn ${MAX_KANJI}) từ cột 'new'.`);
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    if (allKanji.size === 0) {
      throw new Error('Không tìm thấy kanji nào trong file CSV.');
    }

    const kanjiList = Array.from(allKanji);
    console.log(`Danh sách kanji cần precompute: ${kanjiList.join(', ')}`);

    //  Bước 2: Kiểm tra xem đã có kanji nào trong DB chưa
    const missingKanji = [];
    for (const kanji of kanjiList) {
        const existing = await Kanji.findOne({kanji: kanji});
        if(!existing) {
            missingKanji.push(kanji);
        } else {
            console.log(`Kanji "${kanji}" đã tồn tại trong DB, bỏ qua.`);
        }
    }
    if (missingKanji.length === 0) {
        console.log('Tất cả kanji đã có trong DB, không cần precompute.');
        return;
    }
    // Bước 3: Precompute và lưu vào DB
    console.log('Bắt đầu precompute...');
    const startTime = Date.now();
    const results = await getKanjiDetailsFromAI(missingKanji); // Nhận kết quả từ AI
    
    // Bước 4: Lưu results vào DB (sử dụng upsert để tránh duplicate)
    let savedCount = 0;
    for (const data of results) {
      try {
        await Kanji.updateOne(
          { kanji: data.kanji }, // Tìm theo field 'kanji'
          { $set: data },        // Update data
          { upsert: true }       // Insert nếu không tồn tại
        );
        savedCount++;
        console.log(`Đã lưu kanji "${data.kanji}" vào DB.`);
      } catch (err) {
        console.error(`Lỗi lưu kanji "${data.kanji}":`, err);
      }
    }
    
    const totalInDB = await Kanji.countDocuments();
    console.log(`Precompute hoàn tất! Đã lưu ${savedCount} kanji mới/cập nhật. Tổng kanji trong DB: ${totalInDB}. Thời gian: ${(Date.now() - startTime) / 1000} giây.`);

  } catch (error) {
    console.error('Lỗi precompute:', error);
  } finally {
    mongoose.connection.close();
  }
}

precompute();