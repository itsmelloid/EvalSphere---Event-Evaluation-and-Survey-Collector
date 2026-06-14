require('dotenv').config({ path: '../../.env' });
const { sequelize, User, Event, Evaluation, EvaluationQuestion, Submission, EvaluationAnswer, EventAttendee } = require('../models');

const defaultQuestions = [
  { text: 'How satisfied are you with the overall event?', type: 'rating' },
  { text: 'Was the event well organized and managed?', type: 'yes_no' },
  { text: 'How would you rate the quality of the speakers/presenters?', type: 'rating' },
  { text: 'Was the venue comfortable and accessible?', type: 'multiple_choice', options: ['Excellent','Good','Average','Below Average'] },
  { text: 'Was the event schedule followed properly?', type: 'yes_no' },
  { text: 'How informative and relevant was the content presented?', type: 'rating' },
  { text: 'How would you rate the event materials provided?', type: 'rating' },
  { text: 'Was the registration and check-in process smooth?', type: 'yes_no' },
  { text: 'Would you attend similar events organized by us in the future?', type: 'multiple_choice', options: ['Definitely Yes','Probably Yes','Unsure','No'] },
  { text: 'What improvements would you suggest for future events?', type: 'text' },
];

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('DB synced.');

    const admin = await User.create({ first_name: 'System', last_name: 'Admin', email: 'admin@evalsphere.io', password: 'Admin@123', role: 'admin' });
    const staff1 = await User.create({ first_name: 'Ana', last_name: 'Cruz', email: 'staff@evalsphere.io', password: 'Staff@123', role: 'staff', organization: 'EvalSphere' });
    const staff2 = await User.create({ first_name: 'Liza', last_name: 'Garcia', email: 'liza@evalsphere.io', password: 'Staff@123', role: 'staff', organization: 'EvalSphere' });
    const user1  = await User.create({ first_name: 'Maria', last_name: 'Santos', email: 'user@evalsphere.io', password: 'User@123', role: 'user', organization: 'Acme Corp' });
    const user2  = await User.create({ first_name: 'Jose', last_name: 'Reyes', email: 'jose@evalsphere.io', password: 'User@123', role: 'user', organization: 'Tech Inc' });

    // Additional users
    const extraUsers = [
      ['Carlos','Diaz','carlos@evalsphere.io'],
      ['Ana','Lopez','ana.lopez@evalsphere.io'],
      ['Miguel','Torres','miguel@evalsphere.io'],
      ['Sofia','Martinez','sofia@evalsphere.io'],
      ['Daniel','Ramos','daniel@evalsphere.io'],
      ['Laura','Vargas','laura@evalsphere.io'],
      ['Paolo','Bautista','paolo@evalsphere.io'],
      ['Ximena','Ortega','ximena@evalsphere.io'],
      ['Ruben','Cruz','ruben@evalsphere.io'],
      ['Isabel','Garcia','isabel@evalsphere.io'],
    ].map(u => ({ first_name: u[0], last_name: u[1], email: u[2], password: 'User@123', role: 'user' }));
    const createdExtraUsers = await User.bulkCreate(extraUsers);
    console.log('Users seeded.');

    const events = await Event.bulkCreate([
      { title: 'Tech Innovation Summit 2025', description: 'Annual tech summit.', venue: 'Manila Hotel Grand Ballroom', event_date: '2025-09-15', organizer: 'IT Department', category: 'Technology', status: 'Ongoing', created_by: staff1.id },
      { title: 'Leadership & Management Seminar', description: 'Leadership training.', venue: 'BGC Conference Center', event_date: '2025-08-28', organizer: 'HR Team', category: 'Training', status: 'Completed', created_by: staff1.id },
      { title: 'Annual Academic Conference', description: 'Academic research showcase.', venue: 'UP Diliman Auditorium', event_date: '2025-10-05', organizer: 'Academic Affairs', category: 'Education', status: 'Upcoming', created_by: staff2.id },
      { title: 'Workplace Wellness Fair', description: 'Employee wellness event.', venue: 'Makati Sports Club', event_date: '2025-08-10', organizer: 'Admin Office', category: 'Health', status: 'Completed', created_by: staff2.id },
      // 10 more events
      { title: 'Customer Success Meetup', description: 'User community meetup.', venue: 'Ortigas Convention Hall', event_date: '2025-09-02', organizer: 'Customer Success', category: 'Community', status: 'Upcoming', created_by: staff1.id },
      { title: 'Data Science Workshop', description: 'Hands-on data science.', venue: 'Makati Conference Hall', event_date: '2025-07-22', organizer: 'Analytics Team', category: 'Technology', status: 'Completed', created_by: staff1.id },
      { title: 'Healthcare Innovations', description: 'Medical tech showcase.', venue: 'Quezon City Hall', event_date: '2025-11-12', organizer: 'Health Dept', category: 'Health', status: 'Upcoming', created_by: staff2.id },
      { title: 'Education Reform Panel', description: 'Panel discussion.', venue: 'UP Film Center', event_date: '2025-09-30', organizer: 'Academic Affairs', category: 'Education', status: 'Upcoming', created_by: staff2.id },
      { title: 'Design Thinking Bootcamp', description: 'Creative problem solving.', venue: 'BGC Studio', event_date: '2025-06-20', organizer: 'Design Team', category: 'Training', status: 'Completed', created_by: staff1.id },
      { title: 'Startup Pitch Night', description: 'Entrepreneur pitches.', venue: 'Incubation Hub', event_date: '2025-10-20', organizer: 'Venture Office', category: 'Business', status: 'Upcoming', created_by: staff1.id },
      { title: 'Cybersecurity Awareness', description: 'Security best practices.', venue: 'Tech Park Auditorium', event_date: '2025-06-25', organizer: 'IT Security', category: 'Technology', status: 'Completed', created_by: staff2.id },
      { title: 'Marketing Trends 2025', description: 'Marketing conference.', venue: 'SMX Convention Center', event_date: '2025-08-05', organizer: 'Marketing Dept', category: 'Business', status: 'Completed', created_by: staff1.id },
      { title: 'Sustainability Summit', description: 'Environment & business.', venue: 'Green Hall', event_date: '2025-11-05', organizer: 'Sustainability Unit', category: 'Community', status: 'Upcoming', created_by: staff2.id },
      { title: 'Financial Literacy Workshop', description: 'Personal finance education.', venue: 'City Library', event_date: '2025-07-08', organizer: 'Finance Team', category: 'Training', status: 'Completed', created_by: staff2.id },
    ]);
    console.log('Events seeded.');

    for (const event of events) {
      const evaluation = await Evaluation.create({ event_id: event.id, title: `Evaluation: ${event.title}`, description: 'Please rate your experience.', is_published: event.status !== 'Upcoming', created_by: event.created_by });
      await EvaluationQuestion.bulkCreate(defaultQuestions.map((q, i) => ({
        evaluation_id: evaluation.id, question_text: q.text, question_type: q.type,
        options: q.options ? q.options : null, order_index: i,
      })));
    }

    // Seed attendees for new events using some of the extra users
    const extraUserIds = createdExtraUsers.map(u => u.id);
    const newAttendees = [];
    events.slice(4).forEach((ev, idx) => {
      // assign 2 attendees per new event cycling through extra users
      newAttendees.push({ event_id: ev.id, user_id: extraUserIds[idx % extraUserIds.length] });
      newAttendees.push({ event_id: ev.id, user_id: extraUserIds[(idx + 1) % extraUserIds.length] });
    });
    await EventAttendee.bulkCreate(newAttendees);
    console.log('Evaluations seeded.');

    await EventAttendee.bulkCreate([
      { event_id: events[0].id, user_id: user1.id },
      { event_id: events[0].id, user_id: user2.id },
      { event_id: events[1].id, user_id: user1.id },
      { event_id: events[3].id, user_id: user2.id },
    ]);
    console.log('Attendees seeded.');

    console.log('\n=== SEED COMPLETE ===');
    console.log('Admin:  admin@evalsphere.io / Admin@123');
    console.log('Staff:  staff@evalsphere.io / Staff@123');
    console.log('User:   user@evalsphere.io  / User@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
