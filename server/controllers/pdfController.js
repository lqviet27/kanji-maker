const SVGtoPDF = require('svg-to-pdfkit');
const { processInput } = require('../utils/kanjiUtils');
const { loadKanjiSVG, createStrokeSVG } = require('../utils/kanjiUtils');
const { getKanjiDetailsFromDB } = require('../services/kanjiService');
const { createPDFDocument, addPDFHeader, drawGuideLines, checkPageBreak, MarginPDF } = require('../utils/pdfUtils');
const config = require('../config/config');

const generatePDF = async (req, res) => {
  try {
    const { text, numRows } = req.body;

    console.log(`>>>> Received text: ${text}`);
    
    if (!text) {
      return res.status(400).send('No input text');
    }

    let { vocalList, kanjiListOfVocal, kanjiList } = processInput(text);

    console.log(`>>>> Kanji list: ${kanjiList}`);

    const kanjiDetailList = await getKanjiDetailsFromDB(kanjiList);
    const kanjiDetailMap = new Map(kanjiDetailList.map(item => [item.kanji, item]));
    
    const doc = createPDFDocument();
    let yPosition = addPDFHeader(doc,'漢字練習帳 (Kanji Practice)');
    
    // Generate PDF content
    await generatePDFContent(doc, vocalList, kanjiListOfVocal, kanjiDetailMap, yPosition, numRows);
    
    doc.end();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=kanji-guide.pdf');
    doc.pipe(res);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal server error');
  }
};

const generatePDFContent = async (doc, vocalList, kanjiListOfVocal, kanjiDetailMap, startY, numRows) => {
  let yPosition = startY;
  const { rowHeight, cellWidth, numPracticeCells, svgSize } = config.kanji;
  const svgOffset = (cellWidth - svgSize) / 2;

  vocalList.forEach((vocal, index) => {
    // Draw vocabulary
    doc.font('NotoSansJPBold')
       .fontSize(14)
       .fillColor('#333')
       .text(`Từ vựng:  ${vocal}`, MarginPDF, yPosition);
    
    yPosition += 20; 

    const kanjiOfVocal = kanjiListOfVocal[index];

    for (const kanji of kanjiOfVocal) {
      const svgContent = loadKanjiSVG(kanji);
      if (!svgContent) continue;

      const details = kanjiDetailMap.get(kanji);
      if (!details) continue;

      const stepSVGs = createStrokeSVG(svgContent);

      // Draw kanji details
      yPosition = drawKanjiDetails(doc, kanji, details, yPosition);
      
      // Draw stroke order
      yPosition = drawStrokeOrder(doc, stepSVGs, yPosition);
      
      // Draw practice grid
      for (let i = 0; i < numRows; i++) {
        yPosition = checkPageBreak(doc, yPosition, rowHeight + 15);
        yPosition = drawPracticeGrid(doc, svgContent, yPosition, svgOffset);
      }
      // Check for page break
      yPosition = checkPageBreak(doc, yPosition, rowHeight + 15);
    }
  });
};

const drawKanjiDetails = (doc, kanji, details, yPosition) => {
  doc.font('NotoSansJPBold')
     .fontSize(16)
     .fillColor('#333')
     .text(kanji, MarginPDF, yPosition);

  const detailKanjiX = MarginPDF + 40;
  const detailKanjiY = yPosition + 4;
  const hanVietWidth = doc.font('NotoSansJP').fontSize(10).widthOfString(details.hanViet);
  const nghiaWidth = doc.font('NotoSansJP').fontSize(10).widthOfString(details.meaning);
  const onyomiWidth = doc.font('NotoSansJP').fontSize(10).widthOfString(details.onyomi);

  doc.font('NotoSansJPBold')
     .fontSize(10)
     .fillColor('#000')
     .text(details.hanViet, detailKanjiX, detailKanjiY)
     .text(` - ${details.meaning}`, detailKanjiX + hanVietWidth + 5, detailKanjiY)
     .text(details.onyomi, detailKanjiX + hanVietWidth + nghiaWidth + 35, detailKanjiY)
     .text(` | ${details.kunyomi}`, detailKanjiX + hanVietWidth + nghiaWidth + onyomiWidth + 40, detailKanjiY);
  
  return yPosition + 25;
};

const drawStrokeOrder = (doc, stepSVGs, yPosition) => {
  let stepXPosition = MarginPDF;
  stepSVGs.forEach((stepSVG, index) => {
    SVGtoPDF(doc, stepSVG, stepXPosition, yPosition, {
      width: 20,
      height: 20,
      assumePt: true,
      preserveAspectRatio: 'xMidYMid meet',
      color: '#000000'
    });
    stepXPosition += (20 + 10);
  });

  return yPosition + 25;
};

const drawPracticeGrid = (doc, svgContent, yPosition, svgOffset) => {
  const { rowHeight, cellWidth, numPracticeCells, svgSize } = config.kanji;
  
  const totalRowWidth = cellWidth * (1 + numPracticeCells);
  const pageWidth = doc.page.width - (2 * MarginPDF);
  const rowX = MarginPDF + (pageWidth - totalRowWidth) / 2;

  // Draw outer border
  doc.lineWidth(1)
     .rect(rowX, yPosition, totalRowWidth, rowHeight)
     .strokeColor('#333')
     .stroke();

  // First cell with full kanji
  doc.rect(rowX, yPosition, cellWidth, rowHeight)
     .fillAndStroke('#f0f0f0', '#333');
  
  drawGuideLines(doc, rowX, yPosition, cellWidth, rowHeight);
  
  // Draw full kanji
  SVGtoPDF(doc, svgContent, rowX + svgOffset, yPosition + svgOffset, {
    width: svgSize,
    height: svgSize,
    assumePt: true,
    preserveAspectRatio: 'xMidYMid meet',
    color: '#000000'
  });

  // Practice cells
  let cellX = rowX + cellWidth;
  for (let i = 0; i < numPracticeCells; i++) {
    // Draw vertical separators
    if (i < numPracticeCells - 1) {
      doc.lineWidth(0.5)
         .moveTo(cellX + cellWidth, yPosition)
         .lineTo(cellX + cellWidth, yPosition + rowHeight)
         .strokeColor('#ccc')
         .stroke();
    }

    drawGuideLines(doc, cellX, yPosition, cellWidth, rowHeight);
    cellX += cellWidth;
  }

  return yPosition + rowHeight + 15;
};

module.exports = {
  generatePDF
};