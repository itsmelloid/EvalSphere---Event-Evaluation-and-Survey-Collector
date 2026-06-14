const { Sequelize, Op } = require('sequelize');
const { Event, Evaluation, Submission, User, EventAttendee, EvaluationAnswer, EvaluationQuestion, sequelize } = require('../models');
const { success, error } = require('../utils/response');

exports.getEventReport = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: Evaluation, as: 'evaluation', include: [{ model: EvaluationQuestion, as: 'questions' }] },
      ],
    });
    if (!event) return error(res, 'Event not found.', 404);
    const attendeeCount = await EventAttendee.count({ where: { event_id: event.id } });
    let submissionData = { count: 0, avg_rating: null, question_analytics: [] };
    if (event.evaluation) {
      const submissions = await Submission.findAll({
        where: { evaluation_id: event.evaluation.id },
        include: [{ model: EvaluationAnswer, as: 'answers' }],
      });
      submissionData.count = submissions.length;
      const ratedSubs = submissions.filter(s => s.average_rating);
      submissionData.avg_rating = ratedSubs.length > 0
        ? (ratedSubs.reduce((s, sub) => s + parseFloat(sub.average_rating), 0) / ratedSubs.length).toFixed(2)
        : null;
      submissionData.question_analytics = event.evaluation.questions.map(q => {
        const answers = submissions.flatMap(s => s.answers.filter(a => a.question_id === q.id));
        if (q.question_type === 'rating') {
          const ratings = answers.map(a => a.answer_rating).filter(Boolean);
          return { question: q.question_text, type: q.question_type, avg: ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null, count: ratings.length };
        }
        const counts = {};
        answers.forEach(a => { if (a.answer_text) counts[a.answer_text] = (counts[a.answer_text] || 0) + 1; });
        return { question: q.question_text, type: q.question_type, counts, count: answers.length };
      });
    }
    return success(res, { event, attendee_count: attendeeCount, ...submissionData });
  } catch (err) { next(err); }
};

exports.getExportData = async (req, res, next) => {
  try {
    const where = {};
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) where.created_by = req.user.id;

    const events = await Event.findAll({
      where,
      attributes: [
        'id', 'title', 'event_date', 'venue', 'category', 'status', 'organizer',
        [Sequelize.literal('(SELECT COUNT(*) FROM event_attendees WHERE event_attendees.event_id = Event.id)'), 'attendee_count']
      ],
      include: [
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
        { model: Evaluation, as: 'evaluation', attributes: ['id'] }
      ],
      order: [['event_date', 'DESC']]
    });

    const data = await Promise.all(events.map(async (e) => {
      const event = e.toJSON();
      let submissionCount = 0;
      let avgRating = 0;

      if (event.evaluation) {
        submissionCount = await Submission.count({ where: { evaluation_id: event.evaluation.id } });
        const ratingResult = await Submission.findOne({
          where: { evaluation_id: event.evaluation.id },
          attributes: [[Sequelize.fn('AVG', Sequelize.col('average_rating')), 'avg']],
          raw: true
        });
        avgRating = ratingResult?.avg ? parseFloat(parseFloat(ratingResult.avg).toFixed(2)) : 0;
      }

      return {
        'Event Title': event.title,
        'Date': event.event_date,
        'Venue': event.venue,
        'Category': event.category,
        'Status': event.status,
        'Attendees': event.attendee_count,
        'Submissions': submissionCount,
        'Average Rating': avgRating
      };
    }));

    return success(res, data);
  } catch (err) { next(err); }
};

// Export report: styled Excel (xlsx) or PDF output
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.exportReport = async (req, res, next) => {
  try {
    const format = (req.query.format || 'excel').toLowerCase(); // 'excel' or 'pdf'
    const isAdmin = req.user.role === 'admin';
    const where = {};
    if (!isAdmin) where.created_by = req.user.id;

    const events = await Event.findAll({
      where,
      attributes: [
        'id','title','event_date','venue','category','status','organizer',
        [Sequelize.literal('(SELECT COUNT(*) FROM event_attendees WHERE event_attendees.event_id = Event.id)'), 'attendee_count']
      ],
      include: [{ model: Evaluation, as: 'evaluation', attributes: ['id'] }],
      order: [['event_date','DESC']]
    });

    // Determine report type from query.title (frontend sends the readable title)
    const reportTitle = (req.query.title || '').toLowerCase();

    // Helper: build base per-event summary
    const buildEventSummaries = async () => {
      return await Promise.all(events.map(async e => {
        const ev = e.toJSON();
        let submissionCount = 0;
        let avgRating = '';
        if (ev.evaluation) {
          submissionCount = await Submission.count({ where: { evaluation_id: ev.evaluation.id } });
          const r = await Submission.findOne({ where: { evaluation_id: ev.evaluation.id }, attributes: [[Sequelize.fn('AVG', Sequelize.col('average_rating')), 'avg']], raw: true });
          avgRating = r?.avg ? parseFloat(parseFloat(r.avg).toFixed(2)) : '';
        }
        return { title: ev.title, date: ev.event_date, venue: ev.venue, category: ev.category, status: ev.status, organizer: ev.organizer || '', attendees: ev.attendee_count || 0, submissions: submissionCount, avg_rating: avgRating };
      }));
    };

    // Build content depending on requested report
    let rows = [];
    let extra = {};

    if (reportTitle.includes('participation')) {
      // Satisfaction Analysis: per-event avg and per-question averages across platform
      rows = await buildEventSummaries();
      // Gather per-question averages for rating questions across all evaluations
      const questions = await EvaluationQuestion.findAll({ where: {}, attributes: ['id','question_text','question_type','evaluation_id'] });
      const ratingQuestions = questions.filter(q => q.question_type === 'rating');
      const questionAggs = await Promise.all(ratingQuestions.map(async q => {
        const answers = await EvaluationAnswer.findAll({ where: { question_id: q.id }, attributes: [[Sequelize.fn('AVG', Sequelize.col('answer_rating')), 'avg']], raw: true });
        const avg = answers && answers[0] && answers[0].avg ? parseFloat(parseFloat(answers[0].avg).toFixed(2)) : null;
        return { question: q.question_text, evaluation_id: q.evaluation_id, average_rating: avg };
      }));
      extra.question_averages = questionAggs;
      // top/bottom events by avg_rating
      const ranked = [...rows].filter(r => r.avg_rating !== '').sort((a,b) => parseFloat(b.avg_rating || 0) - parseFloat(a.avg_rating || 0));
      extra.top_events = ranked.slice(0,5);
      extra.bottom_events = ranked.slice(Math.max(0, ranked.length - 5));
    } else {
      // Default: Full Platform Report
      rows = await buildEventSummaries();
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const safe = `evalsphere-report-${timestamp}`;

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'EvalSphere';
      wb.created = new Date();
      const ws = wb.addWorksheet('Platform Report', { views: [{ state: 'frozen', ySplit: 4 }] });

      // Title (big, centered) with background
      ws.mergeCells('A1', 'I1');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'EvalSphere — Full Platform Report';
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1720' } };
      ws.getRow(1).height = 28;

      // Subtitle / metadata
      ws.mergeCells('A2', 'I2');
      const sub = ws.getCell('A2');
      sub.value = `Generated: ${new Date().toLocaleString()}    •    Generated by: EvalSphere`; 
      sub.font = { size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      sub.alignment = { horizontal: 'center' };
      ws.getRow(2).height = 16;

      // Column definitions - vary by report type
      if (reportTitle.includes('participation')) {
        ws.columns = [
          { header: 'Event Title', key: 'title', width: 40 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Venue', key: 'venue', width: 25 },
          { header: 'Attendees', key: 'attendees', width: 12 },
          { header: 'Submissions', key: 'submissions', width: 12 },
          { header: 'Submission Rate', key: 'attendance_rate', width: 14 },
        ];
      } else if (reportTitle.includes('satisfaction')) {
        ws.columns = [
          { header: 'Event Title', key: 'title', width: 40 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Avg Rating', key: 'avg_rating', width: 12 },
          { header: 'Submissions', key: 'submissions', width: 12 },
          { header: 'Attendees', key: 'attendees', width: 12 },
        ];
      } else {
        ws.columns = [
          { header: 'Event Title', key: 'title', width: 40 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Venue', key: 'venue', width: 25 },
          { header: 'Category', key: 'category', width: 18 },
          { header: 'Status', key: 'status', width: 12 },
          { header: 'Organizer', key: 'organizer', width: 20 },
          { header: 'Attendees', key: 'attendees', width: 12 },
          { header: 'Submissions', key: 'submissions', width: 12 },
          { header: 'Avg Rating', key: 'avg_rating', width: 12 }
        ];
      }

      // Header row at row 4
      const headerRowIndex = 4;
      const headerRow = ws.getRow(headerRowIndex);
      headerRow.values = ws.columns.map(c => c.header);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } } };
      });
      ws.getRow(headerRowIndex).height = 20;

      // Add data rows starting at row 5
      rows.forEach(r => {
        const payload = {};
        if (reportTitle.includes('participation')) {
          payload.title = r.title; payload.date = r.date; payload.venue = r.venue; payload.attendees = r.attendees; payload.submissions = r.submissions; payload.attendance_rate = r.attendance_rate;
        } else if (reportTitle.includes('satisfaction')) {
          payload.title = r.title; payload.date = r.date; payload.avg_rating = r.avg_rating; payload.submissions = r.submissions; payload.attendees = r.attendees;
        } else {
          payload.title = r.title; payload.date = r.date; payload.venue = r.venue; payload.category = r.category; payload.status = r.status; payload.organizer = r.organizer; payload.attendees = r.attendees; payload.submissions = r.submissions; payload.avg_rating = r.avg_rating;
        }
        const newRow = ws.addRow(payload);
        newRow.getCell('date').numFmt = 'yyyy-mm-dd';
        if (ws.getColumn('attendees')) newRow.getCell('attendees').numFmt = '#,##0';
        if (ws.getColumn('submissions')) newRow.getCell('submissions').numFmt = '#,##0';
        if (ws.getColumn('avg_rating')) newRow.getCell('avg_rating').numFmt = '0.00';
      });

      // Apply zebra fill and borders to data rows
      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > headerRowIndex) {
          const fillColor = rowNumber % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            };
          });
        }
      });

      // Auto filter and view (calculate last column letter)
      const lastCol = ws.columnCount;
      const lastColLetter = String.fromCharCode('A'.charCodeAt(0) + Math.max(0, lastCol - 1));
      ws.autoFilter = { from: `A${headerRowIndex}`, to: `${lastColLetter}${headerRowIndex}` };
      ws.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRowIndex }];

      // For Satisfaction Analysis, add a second sheet with question averages
      if (reportTitle.includes('satisfaction') && extra.question_averages) {
        const qws = wb.addWorksheet('Question Averages');
        qws.columns = [ { header: 'Question', key: 'question', width: 80 }, { header: 'Average Rating', key: 'avg', width: 20 } ];
        extra.question_averages.forEach(q => qws.addRow({ question: q.question, avg: q.average_rating }));
      }

      const buffer = await wb.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      // Use a more descriptive filename
      const fileSuffix = reportTitle.includes('participation') ? 'participation-summary' : reportTitle.includes('satisfaction') ? 'satisfaction-analysis' : 'platform-report';
      res.setHeader('Content-Disposition', `attachment; filename="${safe}-${fileSuffix}.xlsx"`);
      return res.send(Buffer.from(buffer));
    }

    // PDF export
    if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safe}.pdf"`);
      doc.pipe(res);

      const header = () => {
        // Branding header bar
        doc.rect(0, 0, doc.page.width, 70).fill('#0b1220');
        doc.fillColor('#ffffff').fontSize(18).text('EVALSPHERE', 50, 22);
        doc.fontSize(10).fillColor('#cbd5e1').text('Platform Report', 50, 42);
        doc.fillColor('#9ca3af').fontSize(9).text(`Generated: ${new Date().toLocaleString()}`, doc.page.width - 220, 30, { align: 'right' });
        doc.moveDown(3);
      };

      // Footer with page numbers
      const footer = (pagenum, total) => {
        doc.fontSize(9).fillColor('#94a3b8').text(`Page ${pagenum}${total ? ` of ${total}` : ''}`, 0, doc.page.height - 40, { align: 'center' });
      };

      header();

      // Table header
      const startX = 50;
      // Define columns based on report type
      let colWidths;
      let headers;
      if (reportTitle.includes('participation')) {
        colWidths = [240, 60, 120, 60, 60];
        headers = ['Event Title','Date','Venue','Att','Subs'];
      } else if (reportTitle.includes('satisfaction')) {
        colWidths = [260, 60, 60, 60, 60];
        headers = ['Event Title','Date','Avg','Subs','Att'];
      } else {
        colWidths = [170, 60, 100, 70, 50, 80, 40, 50, 40];
        headers = ['Event Title','Date','Venue','Category','Status','Organizer','Att','Subs','Avg'];
      }
      let x = startX; let y = 100;
      doc.fontSize(9).fillColor('#111827');
      // header background
      doc.rect(startX - 6, y - 6, colWidths.reduce((a,b)=>a+b,0)+24, 20).fill('#111827');
      doc.fillColor('#ffffff');
      headers.forEach((h, i) => { doc.text(h, x + 4, y - 2, { width: colWidths[i] - 8 }); x += colWidths[i]; });
      y += 18;

      // data rows
      rows.forEach((r, idx) => {
        x = startX;
        const rowHeight = 18;
        // zebra fill
        if (idx % 2 === 0) {
          doc.rect(startX - 6, y - 4, colWidths.reduce((a,b)=>a+b,0)+24, rowHeight).fill('#f8fafc');
          doc.fillColor('#0f1720');
        } else {
          doc.fillColor('#0f1720');
        }
          let cells;
          if (reportTitle.includes('participation')) {
            cells = [r.title, r.date, r.venue, String(r.attendees), String(r.submissions)];
          } else if (reportTitle.includes('satisfaction')) {
            cells = [r.title, r.date, String(r.avg_rating), String(r.submissions), String(r.attendees)];
          } else {
            cells = [r.title, r.date, r.venue, r.category, r.status, r.organizer, String(r.attendees), String(r.submissions), String(r.avg_rating)];
          }
        cells.forEach((c, i) => { doc.fontSize(9).text(String(c || ''), x + 4, y, { width: colWidths[i] - 8 }); x += colWidths[i]; });
        y += rowHeight;
        // page break handling
        if (y > doc.page.height - 80) {
          // footer current page
          footer(doc.page.number);
          doc.addPage();
          header();
          y = 100;
        }
      });

      // final footer
      footer(doc.page.number);
      // If participation report, add totals summary below table
      if (reportTitle.includes('participation') && extra.totals) {
        doc.addPage();
        header();
        doc.moveDown();
        doc.fontSize(12).fillColor('#0f1720').text('Participation Summary Totals', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#111827').text(`Total Attendees: ${extra.totals.attendees}`);
        doc.fontSize(10).text(`Total Submissions: ${extra.totals.submissions}`);
        doc.fontSize(10).text(`Overall Submission Rate: ${extra.totals.overall_submission_rate}`);
      }

      // If satisfaction report, include question averages and top/bottom listings
      if (reportTitle.includes('satisfaction')) {
        doc.addPage(); header();
        doc.fontSize(12).fillColor('#0f1720').text('Question Average Ratings', { underline: true });
        doc.moveDown(0.5);
        if (extra.question_averages && extra.question_averages.length) {
          extra.question_averages.forEach(q => {
            doc.fontSize(10).fillColor('#111827').text(`${q.question} — ${q.average_rating ?? 'N/A'}`);
          });
        } else {
          doc.fontSize(10).fillColor('#6b7280').text('No question rating data available.');
        }
        // Top/bottom events
        doc.moveDown(); doc.fontSize(12).text('Top Events (by Avg Rating)', { underline: true }); doc.moveDown(0.3);
        (extra.top_events || []).forEach(ev => doc.fontSize(10).text(`${ev.title} — ${ev.avg_rating}`));
        doc.moveDown(); doc.fontSize(12).text('Bottom Events (by Avg Rating)', { underline: true }); doc.moveDown(0.3);
        (extra.bottom_events || []).forEach(ev => doc.fontSize(10).text(`${ev.title} — ${ev.avg_rating}`));
      }

      doc.end();
      return;
    }

    // default: return CSV as fallback
    const header = ['Title','Date','Venue','Category','Status','Organizer','Attendees','Submissions','Average Rating'];
    const csv = [header.join(','), ...rows.map(r => [r.title, r.date, r.venue, r.category, r.status, r.organizer, r.attendees, r.submissions, r.avg_rating].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="evalsphere_report.csv"');
    res.send(csv);
  } catch (err) { next(err); }
};

exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const [totalEvents, totalUsers, totalStaff, totalSubmissions] = await Promise.all([
      Event.count(),
      User.count({ where: { role: 'user' } }),
      User.count({ where: { role: 'staff' } }),
      Submission.count(),
    ]);
    const avgRatingRaw = await Submission.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('average_rating')), 'avg']],
      where: { average_rating: { [Op.not]: null } },
      raw: true,
    });
    const eventsByStatus = await Event.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status'], raw: true,
    });
    const eventsByCategory = await Event.findAll({
      attributes: ['category', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['category'], raw: true,
    });
    const recentEvents = await Event.findAll({
      order: [['event_date', 'DESC']], limit: 5,
      include: [{ model: User, as: 'creator', attributes: ['first_name', 'last_name'] }],
    });
    
    // More compatible way to get monthly trends without MySQL-specific DATE_FORMAT
    const monthlySubmissions = await Submission.findAll({
      attributes: [
        [Sequelize.fn('substr', Sequelize.col('submitted_at'), 1, 7), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('AVG', Sequelize.col('average_rating')), 'avg_rating'],
      ],
      group: [Sequelize.fn('substr', Sequelize.col('submitted_at'), 1, 7)],
      order: [[Sequelize.literal('month'), 'ASC']], limit: 12, raw: true,
    });
    return success(res, {
      summary: { total_events: totalEvents, total_users: totalUsers, total_staff: totalStaff, total_submissions: totalSubmissions, average_rating: avgRatingRaw?.avg ? parseFloat(avgRatingRaw.avg).toFixed(2) : null },
      events_by_status: eventsByStatus,
      events_by_category: eventsByCategory,
      recent_events: recentEvents,
      monthly_trend: monthlySubmissions,
    });
  } catch (err) { next(err); }
};
  // Activity logs removed
