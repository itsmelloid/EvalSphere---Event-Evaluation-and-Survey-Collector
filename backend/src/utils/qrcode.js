const QRCode = require('qrcode');

const generateQR = async (text) => {
  try {
    return await QRCode.toDataURL(text, { errorCorrectionLevel: 'H', width: 300, margin: 2 });
  } catch (err) {
    throw new Error('QR code generation failed: ' + err.message);
  }
};

const generateEventQR = async (eventId) =>
  generateQR(`${process.env.FRONTEND_URL}/events/${eventId}`);

const generateEvaluationQR = async (evaluationId) =>
  generateQR(`${process.env.FRONTEND_URL}/evaluate/${evaluationId}`);

module.exports = { generateQR, generateEventQR, generateEvaluationQR };
