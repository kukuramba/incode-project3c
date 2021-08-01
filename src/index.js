const express = require('express'); 
const data = require('./data');
const crypto = require('crypto');
const pool = require('./scheduleDB');
const app = express();

const port = 3000;

app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public')) 

app.set('view engine', 'ejs');

const users = data.users;

const schedules = data.schedules;

// GET REQUESTS

app.get('/', (_, res) => {
  res.render('index');
});

app.get('/users', (_, res) => {
  res.render('users', {users: users});
});

app.get('/users/new', (_, res) => {
  res.render('newUserForm');
});

app.get('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const singleUser = users[userId];
  if (singleUser === undefined) {
    res.status(404).send(`Incorrect user id: ${userId}`);
  } 
  res.render('singleUser', {users: users, userId: userId});
});

/* GET SCHEDULES - DB QUERY - ASYNC & TRY & CATCH */

app.get('/schedules', async (_, res) => {
  try {
    const schedulesDB = await pool.query(`SELECT * FROM schedule`);
    res.render('schedules', {schedules: schedulesDB.rows});
  } catch (err) {
    console.error(err.message)
  }
});

app.get('/schedules/new', (_, res) => {
  res.render('newScheduleForm', {users: users});
});

app.get('/users/:id/schedules', (req, res) => {
  const userId = Number(req.params.id);
  const userSchedule = [];
  for (let i = 0; i < schedules.length; i++) {
    if (schedules[i].user_id === userId) {
      userSchedule.push(schedules[i]);
    }
  }
  res.render('singleUserSchedule', {userSchedule: userSchedule, userId: userId});
});

// POST REQUESTS

app.post('/users', (req, res) => {
  if (req.body.password !== req.body.password2) {
    res.send("Passwords don't match. Please enter the same password in both password fields");
  } else {
    const newUser = req.body;
    req.body.password = crypto.createHash('sha256').update(req.body.password).digest('hex');
    users.push(newUser);
    res.redirect('users');
  }
});

/* POST SCHEDULES - DB QUERY - ASYNC & TRY & CATCH */

app.post('/schedules', async (req, res) => {
  try {
    const newSchedule = req.body;
    await pool.query(
      `INSERT INTO schedule (user_id, day, start_at, end_at) VALUES($1, $2, $3, $4) RETURNING *`,
      [newSchedule.user_id, newSchedule.day, newSchedule.start_at, newSchedule.end_at] 
    );
    res.redirect('schedules');
  } catch (err) {
    console.error(err.message)
  }
});

/* POST SCHEDULES - DB QUERY - PROMISE */

// app.post('/schedules', (req, res) => {
//   const newSchedule = req.body;
//   pool
//   .query(
//     `INSERT INTO schedule(user_id, day, start_at, end_at) values($1, $2, $3, $4) RETURNING *`,
//     [newSchedule.user_id, newSchedule.day, newSchedule.start_at, newSchedule.end_at]
//   )
//   .then(res.redirect('schedules'))
//   .catch(e => console.error(e.message))
// });
