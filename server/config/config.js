const path = require('path');

const config = {
    API_KEY: process.env.API_KEY,
    PORT: process.env.PORT ||6969,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/kanjiDB',

    fonts: {
        kanjiFont: path.join(__dirname, '..', 'fonts', 'NotoSansJP-VariableFont_wght.ttf'),
        kanjiFontBold: path.join(__dirname, '..', 'fonts', 'NotoSansJP-Bold.ttf'),
    },

    kanji: {
        directoryPath: path.join(__dirname, '..', 'kanji'),
        svgSize: 25,
        cellWidth: 40,
        rowHeight: 40,
        numPracticeCells: 12,
        strokeOrderCells: 6
    },

    ai: {
        model: 'gemini-2.0-flash-lite',
        batchSize: 20,
        maxRetries: 3,
        retryDelay: 1000
    }
    
}

module.exports = config;