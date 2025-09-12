const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const processInput = (kanji) => {
    // danh sách từ vựng
    const vocalList = kanji.split(';');

    // danh sách kanji của từng từ vựng
    const kanjiListOfVocal = vocalList.map(vocal => {
        const kanjiOfVocal = extractKanjiCharacters(vocal);
        return kanjiOfVocal;
    });
    
    // danh sách kanji đã loại bỏ trùng lặp
    const kanjiList = Array.from(new Set(kanjiListOfVocal.flat()));
  
    return {vocalList, kanjiListOfVocal, kanjiList};
}

const extractKanjiCharacters = (text) => {
    const kanjiOnly = text.match(/[\u4E00-\u9FFF]/g)?.join('') || '';
    return Array.from(new Set(kanjiOnly));
};

const loadKanjiSVG = (kanji) => {
    const hex = kanji.charCodeAt(0).toString(16).toLowerCase();
    const kanjiPath = path.join(config.kanji.directoryPath, `0${hex}.svg`);
  
    if (!fs.existsSync(kanjiPath)) {
      console.warn(`SVG file for kanji ${kanji} not found at ${kanjiPath}`);
      return null;
    }
    
    let rawSVG = fs.readFileSync(kanjiPath, 'utf8');
    
    rawSVG = rawSVG
      .replace(/<!DOCTYPE[\s\S]+?\]>/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/width="\d+"/, 'width="100"')
      .replace(/height="\d+"/, 'height="100"')
      .replace(/viewBox="[^"]*"/, 'viewBox="0 0 100 100"')
      .trim();
                  
    return rawSVG;   
};

const createStrokeSVG = (svgContent) => {
    const strokes = svgContent.match(/<path[^>]+\/>/g) || [];
    const texts = svgContent.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    let cumulativePaths = ''; 
    let cumulativeTexts = '';
    let stepSVGs = [];
    
    strokes.forEach((stroke, index) => {
      cumulativePaths += stroke;
      cumulativePaths += '\n';
      cumulativeTexts += texts[index] || ''; 
  
      const stepSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                        <g id="kvg:StrokePaths_step_${index + 1}" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">
                            ${cumulativePaths}
                        </g>
                        <g id="kvg:StrokeNumbers_05f37" style="font-size:8;fill:#808080">
                            ${cumulativeTexts}
                        </g>
                      </svg>`;
                  
      stepSVGs.push(stepSVG);
    });
    
    return stepSVGs;
};

module.exports = {
    processInput,
    extractKanjiCharacters,
    loadKanjiSVG,
    createStrokeSVG
};