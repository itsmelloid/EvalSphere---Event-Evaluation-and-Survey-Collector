const assert = require('assert');
const { User } = require('../models');
const userController = require('./userController');

async function runUpdate(body) {
  const originalFindByPk = User.findByPk;
  const updateCalls = [];
  const user = {
    id: 'user-1',
    update: async (data) => {
      updateCalls.push(data);
      Object.assign(user, data);
      return user;
    },
  };

  User.findByPk = async () => user;

  const res = {
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

  try {
    await userController.update({ params: { id: 'user-1' }, body }, res, (err) => {
      throw err;
    });
  } finally {
    User.findByPk = originalFindByPk;
  }

  return { res, updateCalls };
}

(async () => {
  const withoutPassword = await runUpdate({
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    password: '',
  });

  assert.deepStrictEqual(withoutPassword.updateCalls[0], {
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
  });

  const withPassword = await runUpdate({
    first_name: 'Grace',
    last_name: 'Hopper',
    email: 'grace@example.com',
    password: 'new-secret',
  });

  assert.deepStrictEqual(withPassword.updateCalls[0], {
    first_name: 'Grace',
    last_name: 'Hopper',
    email: 'grace@example.com',
    password: 'new-secret',
  });

  console.log('userController.update tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
