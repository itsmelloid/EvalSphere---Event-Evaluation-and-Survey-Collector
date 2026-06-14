const assert = require('assert');
const { Event, Evaluation, EvaluationQuestion, sequelize } = require('../models');
const eventController = require('./eventController');

function makeRes() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

async function runCreateAsStaff() {
  const originalEventCreate = Event.create;
  const originalEvaluationCreate = Evaluation.create;
  const originalQuestionBulkCreate = EvaluationQuestion.bulkCreate;
  const originalTransaction = sequelize.transaction;
  const calls = { eventCreate: null, evaluationCreate: null, questions: null };
  const transaction = {
    committed: false,
    rolledBack: false,
    async commit() { this.committed = true; },
    async rollback() { this.rolledBack = true; },
  };

  sequelize.transaction = async () => transaction;
  Event.create = async (data) => {
    calls.eventCreate = data;
    return { id: 'event-1', ...data, toJSON: () => ({ id: 'event-1', ...data }) };
  };
  Evaluation.create = async (data) => {
    calls.evaluationCreate = data;
    return { id: 'evaluation-1', ...data };
  };
  EvaluationQuestion.bulkCreate = async (questions) => {
    calls.questions = questions;
    return questions;
  };

  const res = makeRes();
  try {
    await eventController.create({
      body: {
        title: 'Staff Planning Day',
        description: 'Quarter planning',
        venue: 'Main Hall',
        event_date: '2026-07-10',
        category: 'Training',
        is_public: true,
      },
      user: { id: 'staff-1', role: 'staff' },
      file: null,
    }, res, (err) => { throw err; });
  } finally {
    Event.create = originalEventCreate;
    Evaluation.create = originalEvaluationCreate;
    EvaluationQuestion.bulkCreate = originalQuestionBulkCreate;
    sequelize.transaction = originalTransaction;
  }

  return { res, calls, transaction };
}

async function runGetAllForUser() {
  const originalFindAndCountAll = Event.findAndCountAll;
  let capturedWhere = null;
  Event.findAndCountAll = async ({ where }) => {
    capturedWhere = where;
    return { count: 0, rows: [] };
  };

  const res = makeRes();
  try {
    await eventController.getAll({
      query: {},
      user: { id: 'user-1', role: 'user' },
    }, res, (err) => { throw err; });
  } finally {
    Event.findAndCountAll = originalFindAndCountAll;
  }

  return capturedWhere;
}

async function runReview(action) {
  const originalFindByPk = Event.findByPk;
  const updateCalls = [];
  const event = {
    id: 'event-1',
    title: 'Staff Planning Day',
    approval_status: 'Pending',
    is_public: false,
    published_at: null,
    async update(data) {
      updateCalls.push(data);
      Object.assign(event, data);
      return event;
    },
  };
  Event.findByPk = async () => event;

  const res = makeRes();
  try {
    await eventController.reviewApproval({
      params: { id: 'event-1' },
      body: { action },
      user: { id: 'admin-1', role: 'admin' },
    }, res, (err) => { throw err; });
  } finally {
    Event.findByPk = originalFindByPk;
  }

  return { res, updateCalls };
}

(async () => {
  process.env.FRONTEND_URL = 'http://localhost:5173';

  const created = await runCreateAsStaff();
  assert.strictEqual(created.transaction.committed, true);
  assert.strictEqual(created.calls.eventCreate.approval_status, 'Pending');
  assert.strictEqual(created.calls.eventCreate.is_public, false);
  assert.strictEqual(created.calls.evaluationCreate.is_published, false);
  assert.strictEqual(created.calls.questions.length, 10);
  assert.strictEqual(created.res.statusCode, 201);
  assert.strictEqual(created.res.payload.data.event_url, 'http://localhost:5173/events/event-1');
  assert.ok(created.res.payload.data.qr_code.startsWith('data:image/png;base64,'));

  const userWhere = await runGetAllForUser();
  assert.deepStrictEqual(userWhere, { approval_status: 'Approved', is_public: true });

  const approved = await runReview('approve');
  assert.deepStrictEqual(approved.updateCalls[0], { approval_status: 'Approved' });
  assert.strictEqual(approved.res.payload.message, 'Event approved.');

  const published = await runReview('publish');
  assert.strictEqual(published.updateCalls[0].approval_status, 'Approved');
  assert.strictEqual(published.updateCalls[0].is_public, true);
  assert.ok(published.updateCalls[0].published_at instanceof Date);
  assert.strictEqual(published.res.payload.message, 'Event published.');

  const rejected = await runReview('reject');
  assert.deepStrictEqual(rejected.updateCalls[0], {
    approval_status: 'Rejected',
    is_public: false,
    published_at: null,
  });
  assert.strictEqual(rejected.res.payload.message, 'Event rejected.');

  console.log('eventController approval tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
