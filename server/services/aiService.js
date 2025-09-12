const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

const genAI = new GoogleGenerativeAI(config.API_KEY);
const model = genAI.getGenerativeModel({ model: config.ai.model });

const getKanjiDetailsFromAI = async (kanjiList) => {
  const batchSize = config.ai.batchSize;
  const results = [];
  
  for (let i = 0; i < kanjiList.length; i += batchSize) {
    const batch = kanjiList.slice(i, i + batchSize);
    const prompt = createKanjiPrompt(batch);
    
    let retries = config.ai.maxRetries;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        const res = await model.generateContent(prompt);
        const response = await res.response;
        let text = response.text();

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(text);
        results.push(...jsonResponse);
        console.log(`Batch processed: ${jsonResponse.length} kanji`);
        success = true;
      } catch (error) {
        console.error(`Lỗi khi lấy dữ liệu cho batch Kanji (thử lại ${config.ai.maxRetries + 1 - retries}/${config.ai.maxRetries}):`, error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, config.ai.retryDelay));
        } else {
          console.error(`Đã hết lượt thử cho batch Kanji:`, error);
        }
      }
    }
  }
  
  console.log(`Tổng số kanji xử lý: ${results.length}`);
  return results;
};

const createKanjiPrompt = (batch) => {
  return `Provide detailed information for each of the following Kanji characters in the EXACT order listed: "${batch.join(", ")}".
Return ONLY a valid JSON array of objects (strict JSON format with double-quoted property names). Do NOT include any additional text, explanations, markdown, or code blocks. The output must be parseable by JSON.parse() without errors.Ensure the array has EXACTLY ${batch.length} objects, one for each provided Kanji. Match the order of the input list.If there are multiple readings or meanings, separate them with commas in the string values (e.g., "にち, じつ").Always provide onyomi and kunyomi in lowercase hiragana script only (not katakana). If there is no reading, use "none"."hanViet" is the Sino-Vietnamese (Hán Việt) reading, which is the Vietnamese pronunciation of the Chinese character (e.g., "Tam" for 三, not the meaning "ba")."meaning" is the Vietnamese meaning/translation (e.g., "ba, số ba" for 三).Example for input "日,月":
[
{
  "kanji": "日",
  "hanViet": "Nhật",
  "meaning": "ngày, mặt trời",
  "onyomi": "にち, じつ",
  "kunyomi": "ひ, -び, -か"
},
{
  "kanji": "月",
  "hanViet": "Nguyệt",
  "meaning": "tháng, mặt trăng",
  "onyomi": "げつ, がつ",
  "kunyomi": "つき"
}
]

Additional example for "織,職":
[
{
  "kanji": "織",
  "hanViet": "Chức",
  "meaning": "dệt, vải dệt",
  "onyomi": "しょく, しき",
  "kunyomi": "おる, おり"
},
{
  "kanji": "職",
  "hanViet": "Chức",
  "meaning": "chức vụ, nghề nghiệp",
  "onyomi": "しょく",
  "kunyomi": "none"
}
]

Additional example for "三":
[
{
  "kanji": "三",
  "hanViet": "Tam",
  "meaning": "ba, số ba",
  "onyomi": "さん",
  "kunyomi": "み, みっつ"
}
]

Expected structure (use double quotes for all keys, hiragana for readings):
[
{
  "kanji": "character",
  "hanViet": "Sino-Vietnamese (Hán Việt) reading (comma-separated if multiple)",
  "meaning": "Vietnamese meaning/translation (comma-separated if multiple)",
  "onyomi": "On'yomi reading in lowercase hiragana (comma-separated if multiple, not katakana)",
  "kunyomi": "Kun'yomi reading in lowercase hiragana (comma-separated if multiple, not katakana)"
}
]`;
};

module.exports = {
  getKanjiDetailsFromAI
};