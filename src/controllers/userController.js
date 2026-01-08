const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../models/userModel');

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const createUserController = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Both name and email are required.' });
  }

  const user = await createUser({ name, email });
  return res.status(201).json({ data: user });
});

const listUsersController = asyncHandler(async (req, res) => {
  const users = await getUsers();
  return res.status(200).json({ data: users });
});

const getUserController = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.status(200).json({ data: user });
});

const updateUserController = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const updated = await updateUser(req.params.id, req.body);
  return res.status(200).json({ data: updated });
});

const deleteUserController = asyncHandler(async (req, res) => {
  const removed = await deleteUser(req.params.id);

  if (!removed) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.status(204).send();
});

module.exports = {
  createUserController,
  listUsersController,
  getUserController,
  updateUserController,
  deleteUserController
};
