const { Op, Sequelize } = require('sequelize');
const { Event, EventAttendee, Evaluation, EvaluationQuestion, Submission, User, sequelize } = require('../models');
const { success, error } = require('../utils/response');
const { generateEventQR } = require('../utils/qrcode');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status, category, search, all = false } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) where.title = { [Op.like]: `%${search}%` };
    if (req.user.role === 'staff') where.created_by = req.user.id;
    
    // For users, only show approved and public events
    if (req.user.role === 'user') {
      where.approval_status = 'Approved';
      where.is_public = true;
    }

    const queryOptions = {
      where,
      order: [['event_date', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: Evaluation, as: 'evaluation', attributes: ['id', 'is_published', 'title'] }
      ],
    };

    // Handle pagination bypass for exports/reports
    if (String(all) !== 'true') {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await Event.findAndCountAll(queryOptions);
    return success(res, { events: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Evaluation, as: 'evaluation', attributes: ['id', 'title', 'is_published', 'closes_at'] },
      ],
    });
    if (!event) return error(res, 'Event not found.', 404);
    if (req.user.role === 'user' && (event.approval_status !== 'Approved' || !event.is_public)) {
      return error(res, 'Event not found.', 404);
    }
    const attendeeCount = await EventAttendee.count({ where: { event_id: event.id } });
    return success(res, { ...event.toJSON(), attendee_count: attendeeCount });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, venue, event_date, start_time, end_time, organizer, category, max_participants, is_public } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const isAdmin = req.user.role === 'admin';
    const approvalStatus = isAdmin ? 'Approved' : 'Pending';
    const eventIsPublic = isAdmin ? is_public !== false && is_public !== 'false' : false;
    // Use a transaction to ensure event, evaluation and questions are created together
    const t = await sequelize.transaction();
    try {
      const event = await Event.create({
        title, description, venue, event_date, start_time, end_time, organizer, category,
        max_participants,
        is_public: eventIsPublic,
        approval_status: approvalStatus,
        published_at: eventIsPublic ? new Date() : null,
        image,
        created_by: req.user.id,
      }, { transaction: t });

      // Create default evaluation for the event
      const evaluation = await Evaluation.create({
        event_id: event.id,
        title: `${title} - Event Evaluation`,
        description: `Automatic evaluation for event ${title}`,
        is_anonymous: false,
        is_published: false,
        created_by: req.user.id,
      }, { transaction: t });

      // Create 10 default questions (rating type)
      const questions = [];
      for (let i = 1; i <= 10; i++) {
        questions.push({
          evaluation_id: evaluation.id,
          question_text: `Question ${i}: Please rate this aspect of the event.`,
          question_type: 'rating',
          options: null,
          is_required: true,
          order_index: i - 1,
        });
      }
      await EvaluationQuestion.bulkCreate(questions, { transaction: t });

      await t.commit();

      // Event QR is created immediately, even while the event awaits admin review.
      const eventUrl = `${process.env.FRONTEND_URL}/events/${event.id}`;
      const eventQr = await generateEventQR(event.id);

      return success(res, { event, evaluation, qr_code: eventQr, event_url: eventUrl }, 'Event and evaluation created successfully.', 201);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return error(res, 'Event not found.', 404);
    if (req.user.role === 'staff' && event.created_by !== req.user.id) return error(res, 'Permission denied.', 403);
    const image = req.file ? `/uploads/${req.file.filename}` : event.image;
    const { approval_status, published_at, ...body } = req.body;
    if (req.user.role === 'staff') delete body.is_public;
    await event.update({ ...body, image });
    return success(res, event, 'Event updated successfully.');
  } catch (err) { next(err); }
};

exports.reviewApproval = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return error(res, 'Event not found.', 404);

    const action = String(req.body.action || '').toLowerCase();
    if (!['approve', 'reject', 'publish', 'unpublish'].includes(action)) {
      return error(res, 'Invalid approval action.', 400);
    }

    if (action === 'approve') {
      await event.update({ approval_status: 'Approved' });
      return success(res, event, 'Event approved.');
    }

    if (action === 'reject') {
      await event.update({ approval_status: 'Rejected', is_public: false, published_at: null });
      return success(res, event, 'Event rejected.');
    }

    if (action === 'publish') {
      await event.update({ approval_status: 'Approved', is_public: true, published_at: new Date() });
      return success(res, event, 'Event published.');
    }

    await event.update({ is_public: false, published_at: null });
    return success(res, event, 'Event unpublished.');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return error(res, 'Event not found.', 404);
    if (req.user.role === 'staff' && event.created_by !== req.user.id) return error(res, 'Permission denied.', 403);
    await event.destroy();
    return success(res, null, 'Event deleted successfully.');
  } catch (err) { next(err); }
};

exports.registerAttendee = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return error(res, 'Event not found.', 404);
    if (event.approval_status !== 'Approved' || !event.is_public) return error(res, 'Event is not published.', 400);
    if (event.status === 'Completed' || event.status === 'Cancelled') return error(res, 'Registration closed.', 400);
    const existing = await EventAttendee.findOne({ where: { event_id: event.id, user_id: req.user.id } });
    if (existing) return error(res, 'Already registered for this event.', 409);
    const attendee = await EventAttendee.create({ event_id: event.id, user_id: req.user.id });
    return success(res, attendee, 'Registered successfully.', 201);
  } catch (err) { next(err); }
};

exports.getQR = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return error(res, 'Event not found.', 404);
    const qr = await generateEventQR(event.id);
    return success(res, { qr_code: qr, event_url: `${process.env.FRONTEND_URL}/events/${event.id}` });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return error(res, 'Event not found.', 404);
    
    // Permission check for staff
    if (req.user.role === 'staff' && event.created_by !== req.user.id) {
      return error(res, 'Permission denied.', 403);
    }

    const attendeeCount = await EventAttendee.count({ where: { event_id: event.id } });
    const evaluation = await Evaluation.findOne({ where: { event_id: event.id } });
    const submissionCount = evaluation ? await Submission.count({ where: { evaluation_id: evaluation.id } }) : 0;
    
    const avgRating = evaluation
      ? await Submission.findOne({ where: { evaluation_id: evaluation.id }, attributes: [[Sequelize.fn('AVG', Sequelize.col('average_rating')), 'avg']], raw: true })
      : null;

    return success(res, {
      attendees: attendeeCount,
      submissions: submissionCount,
      response_rate: attendeeCount > 0 ? parseFloat(((submissionCount / attendeeCount) * 100).toFixed(1)) : 0,
      average_rating: avgRating?.avg ? parseFloat(parseFloat(avgRating.avg).toFixed(2)) : null,
    });
  } catch (err) { next(err); }
};

/**
 * Combined report data for all accessible events
 * Used for the "Export Reports" feature on Admin and Staff dashboards
 */
exports.getReportData = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'staff') where.created_by = req.user.id;

    const events = await Event.findAll({
      where,
      order: [['event_date', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] },
        { model: Evaluation, as: 'evaluation', attributes: ['id'] }
      ]
    });

    const report = await Promise.all(events.map(async (event) => {
      const attendeeCount = await EventAttendee.count({ where: { event_id: event.id } });
      const evaluationId = event.evaluation?.id;
      const submissionCount = evaluationId ? await Submission.count({ where: { evaluation_id: evaluationId } }) : 0;
      
      let avgRatingVal = 0;
      if (evaluationId) {
        const result = await Submission.findOne({ 
          where: { evaluation_id: evaluationId }, 
          attributes: [[Sequelize.fn('AVG', Sequelize.col('average_rating')), 'avg']], 
          raw: true 
        });
        avgRatingVal = result?.avg ? parseFloat(parseFloat(result.avg).toFixed(2)) : 0;
      }

      return {
        id: event.id,
        title: event.title,
        date: event.event_date,
        venue: event.venue,
        category: event.category,
        status: event.status,
        organizer: event.organizer,
        attendees: attendeeCount,
        submissions: submissionCount,
        avg_rating: avgRatingVal
      };
    }));

    return success(res, report);
  } catch (err) { next(err); }
};
