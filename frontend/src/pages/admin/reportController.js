const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Event, User, Submission } = require('../models');

exports.exportReport = async (req, res) => {
  const { format, title } = req.query;
  
  // 1. Fetch data based on report type (Simplified for example)
  const events = await Event.findAll({ include: [{ model: User, as: 'creator' }] });
  
  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    // Design: Professional Header
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title.toUpperCase();
    titleCell.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3D7FFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    sheet.getRow(2).values = ['Generated on:', new Date().toLocaleString(), '', 'Platform:', 'EvalSphere'];
    sheet.getRow(2).font = { italic: true, size: 10 };

    // Design: Data Headers
    const headerRow = sheet.getRow(4);
    headerRow.values = ['Event ID', 'Title', 'Category', 'Venue', 'Status'];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C2438' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Design: Data Rows with zebra striping
    events.forEach((event, i) => {
      const row = sheet.addRow([event.id, event.title, event.category, event.venue, event.status]);
      if (i % 2 === 0) {
        row.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } });
      }
    });

    sheet.columns.forEach(col => col.width = 20);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report.xlsx`);
    return workbook.xlsx.write(res).then(() => res.end());
  }

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Design: Header Branding
    doc.rect(0, 0, 600, 80).fill('#1C2438');
    doc.fillColor('#FFFFFF').fontSize(20).text('EVALSPHERE', 50, 25, { characterSpacing: 2 });
    doc.fontSize(10).text('OFFICIAL PLATFORM REPORT', 50, 50, { opacity: 0.8 });
    
    doc.moveDown(4);
    doc.fillColor('#1C2438').fontSize(16).text(title, { underline: true });
    doc.fontSize(10).fillColor('#64748B').text(`Generated: ${new Date().toLocaleString()}`);
    
    doc.moveDown(2);

    // Design: Simple Table Implementation
    const tableTop = 200;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Title', 50, tableTop);
    doc.text('Category', 300, tableTop);
    doc.text('Status', 450, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#E2E8F0').stroke();

    let y = tableTop + 30;
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    
    events.forEach(event => {
      doc.text(event.title, 50, y, { width: 230 });
      doc.text(event.category, 300, y);
      doc.text(event.status, 450, y);
      y += 25;
      
      // Add new page if needed
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();
  }
};