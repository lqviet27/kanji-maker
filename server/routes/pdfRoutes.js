const express = require('express');
const { generatePDF } = require('../controllers/pdfController');

const router = express.Router();

router.post('/generate-pdf', generatePDF);

module.exports = router;