const { query } = require('../config/db');

const mapUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  created_at: row.created_at
});

const createUser = async ({ name, email }) => {
  const insertSql = 'INSERT INTO users (name, email) VALUES (?, ?)';
  const [result] = await query(insertSql, [name, email]);
  const [rows] = await query('SELECT id, name, email, created_at FROM users WHERE id = ?', [result.insertId]);
  return rows.length ? mapUser(rows[0]) : null;
};

const getUsers = async () => {
  const [rows] = await query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
  return rows.map(mapUser);
};

const getUserById = async (id) => {
  const [rows] = await query('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
  return rows.length ? mapUser(rows[0]) : null;
};

const updateUser = async (id, { name, email }) => {
  const updates = [];
  const params = [];

  if (typeof name === 'string') {
    updates.push('name = ?');
    params.push(name);
  }

  if (typeof email === 'string') {
    updates.push('email = ?');
    params.push(email);
  }

  if (!updates.length) {
    const error = new Error('Provide at least one field to update.');
    error.status = 400;
    throw error;
  }

  params.push(id);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  await query(sql, params);
  return getUserById(id);
};

const deleteUser = async (id) => {
  const [result] = await query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
