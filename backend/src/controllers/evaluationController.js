const { Sequelize } = require('sequelize');
const { Evaluation, EvaluationQuestion, EvaluationAnswer, Submission, Event, User, sequelize } = require('../models');
const { success, error } = require('../utils/response');
const { generateEvaluationQR } = require('../utils/qrcode');

exports.getByEvent = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findOne({
      where: { event_id: req.params.eventId },
      include: [{ model: EvaluationQuestion, as: 'questions' }],
      order: [[{ model: EvaluationQuestion, as: 'questions' }, 'order_index', 'ASC']]
    });
    if (!evaluation) {
      // If no evaluation exists for this event, create a default one with 10 rating questions
      const event = await Event.findByPk(req.params.eventId);
      if (!event) return error(res, 'Event not found.', 404);
      if (req.user.role === 'user' && (event.approval_status !== 'Approved' || !event.is_public)) {
        return error(res, 'Event not found.', 404);
      }

      const t = await sequelize.transaction();
      try {
        const newEval = await Evaluation.create({
          event_id: event.id,
          title: `${event.title} - Event Evaluation`,
          description: `Automatic evaluation for event ${event.title}`,
          is_anonymous: false,
          is_published: false,
          created_by: req.user?.id || null,
        }, { transaction: t });

        const questions = [];
        for (let i = 1; i <= 10; i++) {
          questions.push({
            evaluation_id: newEval.id,
            question_text: `Question ${i}: Please rate this aspect of the event.`,
            question_type: 'rating',
            options: null,
            is_required: true,
            order_index: i - 1,
          });
        }
        await EvaluationQuestion.bulkCreate(questions, { transaction: t });
        await t.commit();

        const full = await Evaluation.findByPk(newEval.id, { 
          include: [{ model: EvaluationQuestion, as: 'questions' }],
          order: [[{ model: EvaluationQuestion, as: 'questions' }, 'order_index', 'ASC']]
        });
        return success(res, full);
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
    if (req.user.role === 'user') {
      const event = await Event.findByPk(evaluation.event_id);
      if (!event || event.approval_status !== 'Approved' || !event.is_public) {
        return error(res, 'Event not found.', 404);
      }
    }
    return success(res, evaluation);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, {
      include: [{ model: EvaluationQuestion, as: 'questions' }],
      order: [[{ model: EvaluationQuestion, as: 'questions' }, 'order_index', 'ASC']]
    });
    if (!evaluation) return error(res, 'Evaluation not found.', 404);
    return success(res, evaluation);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { event_id, title, description, is_anonymous, opens_at, closes_at, questions, is_published } = req.body;
    const event = await Event.findByPk(event_id);
    if (!event) return error(res, 'Event not found.', 404);
    if (req.user.role === 'staff' && event.created_by !== req.user.id) return error(res, 'Permission denied.', 403);
    const existing = await Evaluation.findOne({ where: { event_id } });
    if (existing) return error(res, 'Evaluation already exists for this event.', 409);
    if (!questions || questions.length < 10) return error(res, 'Minimum 10 questions required.', 400);

    const t = await sequelize.transaction();
    try {
      const evaluation = await Evaluation.create({ 
        event_id, title, description, is_anonymous, opens_at, closes_at, 
        is_published: !!is_published, created_by: req.user.id 
      }, { transaction: t });

      const qDocs = questions.map((q, i) => ({
        evaluation_id: evaluation.id, question_text: q.question_text, question_type: q.question_type,
        options: q.options ? JSON.stringify(q.options) : null,
        is_required: q.is_required !== false,
        order_index: i
      }));
      await EvaluationQuestion.bulkCreate(qDocs, { transaction: t });
      await t.commit();
      const full = await Evaluation.findByPk(evaluation.id, { include: [{ model: EvaluationQuestion, as: 'questions' }] });
      return success(res, full, 'Evaluation created.', 201);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) return error(res, 'Evaluation not found.', 404);
    const { questions, ...evalData } = req.body;

    const t = await sequelize.transaction();
    try {
      await evaluation.update(evalData, { transaction: t });
      if (questions && questions.length >= 10) {
        await EvaluationQuestion.destroy({ where: { evaluation_id: evaluation.id }, transaction: t });
        await EvaluationQuestion.bulkCreate(questions.map((q, i) => ({
          evaluation_id: evaluation.id, question_text: q.question_text, question_type: q.question_type,
          options: q.options ? JSON.stringify(q.options) : null, is_required: q.is_required !== false, order_index: i
        })), { transaction: t });
      }
      await t.commit();
      const full = await Evaluation.findByPk(evaluation.id, { include: [{ model: EvaluationQuestion, as: 'questions' }] });
      return success(res, full, 'Evaluation updated.');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { next(err); }
};

exports.publish = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, { include: [{ model: EvaluationQuestion, as: 'questions' }] });
    if (!evaluation) return error(res, 'Evaluation not found.', 404);
    if (evaluation.questions.length < 10) return error(res, 'Need at least 10 questions to publish.', 400);
    await evaluation.update({ is_published: !evaluation.is_published });
    return success(res, evaluation, `Evaluation ${evaluation.is_published ? 'published' : 'unpublished'}.`);
  } catch (err) { next(err); }
};

exports.submit = async (req, res, next) => {
  try {
    const { evaluation_id, answers } = req.body;
    const evaluation = await Evaluation.findByPk(evaluation_id, { include: [{ model: EvaluationQuestion, as: 'questions' }] });
    if (!evaluation) return error(res, 'Evaluation not found.', 404);
    if (!evaluation.is_published) return error(res, 'Evaluation is not open.', 400);

    const existing = await Submission.findOne({ where: { evaluation_id, user_id: req.user.id } });
    if (existing && !evaluation.allow_multiple) return error(res, 'You have already submitted this evaluation.', 409);

    const ratingAnswers = (answers || []).filter(a => {
      // Use loose equality (==) to handle string/number ID mismatches from JSON payloads
      const qObj = evaluation.questions.find(q => q.id == a.question_id);
      return qObj && qObj.question_type === 'rating' && a.answer_rating != null;
    });

    let avgRating = null;
    if (ratingAnswers.length > 0) {
      const sum = ratingAnswers.reduce((s, a) => s + (parseFloat(a.answer_rating) || 0), 0);
      avgRating = (sum / ratingAnswers.length).toFixed(2);
    }

    const t = await sequelize.transaction();
    try {
      const submission = await Submission.create({
        evaluation_id, user_id: evaluation.is_anonymous ? null : req.user.id,
        average_rating: avgRating, ip_address: req.ip,
      }, { transaction: t });

      await EvaluationAnswer.bulkCreate((answers || []).map(a => ({
        submission_id: submission.id, question_id: a.question_id,
        answer_text: a.answer_text || null, answer_rating: a.answer_rating || null,
        answer_options: a.answer_options ? JSON.stringify(a.answer_options) : null,
      })), { transaction: t });

  await t.commit();
  // notifications feature removed; no in-app notifications are created
      return success(res, { submission_id: submission.id }, 'Evaluation submitted successfully.', 201);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) { next(err); }
};

exports.getResponses = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, { include: [{ model: EvaluationQuestion, as: 'questions' }] });
    if (!evaluation) return error(res, 'Evaluation not found.', 404);
    
    const { page = 1, limit = 20, all = false } = req.query;
    
    const queryOptions = {
      where: { evaluation_id: evaluation.id },
      include: [
        { model: EvaluationAnswer, as: 'answers', include: [{ model: EvaluationQuestion, as: 'question' }] },
        { model: User, as: 'respondent', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
      order: [['submitted_at', 'DESC']],
    };

    if (String(all) !== 'true') {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    const { count, rows } = await Submission.findAndCountAll(queryOptions);
    return success(res, { evaluation, submissions: rows, total: count, page: parseInt(page) });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id, {
      include: [{ model: EvaluationQuestion, as: 'questions' }],
    });
    if (!evaluation) return error(res, 'Evaluation not found.', 404);
    const submissions = await Submission.findAll({
      where: { evaluation_id: evaluation.id },
      include: [{ model: EvaluationAnswer, as: 'answers' }],
    });
    const totalSubmissions = submissions.length;
    
    const ratedSubs = submissions.filter(s => s.average_rating);
    const avgRating = totalSubmissions > 0
      ? (ratedSubs.length > 0 ? ratedSubs.reduce((sum, s) => sum + parseFloat(s.average_rating), 0) / ratedSubs.length : 0)
      : 0;

    const questionStats = evaluation.questions.map(q => {
      const answers = submissions.flatMap(s => s.answers.filter(a => a.question_id === q.id));
      if (q.question_type === 'rating') {
        const ratings = answers.map(a => a.answer_rating).filter(Boolean);
        const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
        const dist = [1,2,3,4,5].map(n => ({ rating: n, count: ratings.filter(r => r === n).length }));
        return { question: q, avg: avg.toFixed(2), distribution: dist, total_responses: ratings.length };
      }
      if (q.question_type === 'yes_no' || q.question_type === 'multiple_choice') {
        const counts = {};
        answers.forEach(a => { if (a.answer_text) counts[a.answer_text] = (counts[a.answer_text] || 0) + 1; });
        return { question: q, counts, total_responses: answers.length };
      }
      return { question: q, total_responses: answers.length, text_responses: answers.map(a => a.answer_text).filter(Boolean) };
    });

    return success(res, { evaluation, total_submissions: totalSubmissions, average_rating: avgRating.toFixed(2), question_stats: questionStats });
  } catch (err) { next(err); }
};

exports.getQR = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findByPk(req.params.id);
    if (!evaluation) return error(res, 'Evaluation not found.', 404);
    const qr = await generateEvaluationQR(evaluation.id);
    return success(res, { qr_code: qr });
  } catch (err) { next(err); }
};

exports.hasSubmitted = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({ where: { evaluation_id: req.params.id, user_id: req.user.id } });
    return success(res, { has_submitted: !!submission, submission_id: submission?.id });
  } catch (err) { next(err); }
};
