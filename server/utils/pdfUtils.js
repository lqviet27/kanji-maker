const PDFDocument = require('pdfkit');
const config = require('../config/config');

const MarginPDF = 30;

const createPDFDocument = () => {
    const doc = new PDFDocument({ size: 'A4', margin: MarginPDF });
    
    doc.registerFont('NotoSansJP', config.fonts.kanjiFont);
    doc.registerFont('NotoSansJPBold', config.fonts.kanjiFontBold);
    
    return doc;
};

const addPDFHeader = (doc, title) => {
    doc.font('NotoSansJPBold')
     .fontSize(24)
     .fillColor('#333')
     .text(title, { align: 'center' });
  
    return doc.y + 30;
}

const drawGuideLines = (doc, x, y, width, height) => {
  // Vertical guide (dashed, middle)
  doc.lineWidth(0.5)
     .dash(3, { space: 2 })
     .moveTo(x + width / 2, y)
     .lineTo(x + width / 2, y + height)
     .strokeColor('#cccccc')
     .stroke()
     .undash();

  // Horizontal guide (dashed, middle)
  doc.lineWidth(0.5)
     .dash(3, { space: 2 })
     .moveTo(x, y + height / 2)
     .lineTo(x + width, y + height / 2)
     .strokeColor('#cccccc')
     .stroke()
     .undash();
     
  // Reset về trạng thái mặc định
  doc.lineWidth(1);
  doc.strokeColor('#000000');
};

const checkPageBreak = (doc, yPosition, requiredHeight) => {
  if (yPosition + requiredHeight > doc.page.height - 30) {
    doc.addPage();
    return 30;
  }
  return yPosition;
};

module.exports = {
  createPDFDocument,
  addPDFHeader,
  drawGuideLines,
  checkPageBreak,
  MarginPDF
};