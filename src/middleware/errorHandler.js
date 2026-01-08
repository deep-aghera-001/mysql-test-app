const mysqlErrorMap = {
  ER_DUP_ENTRY: {
    status: 409,
    message: 'Duplicate entry. The value you provided already exists.'
  },
  ER_BAD_DB_ERROR: {
    status: 500,
    message: 'Database does not exist or is unreachable.'
  }
};

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  const mysqlMeta = err.code ? mysqlErrorMap[err.code] : undefined;
  const status = (err.status || mysqlMeta?.status || 500);
  const payload = {
    message: mysqlMeta?.message || err.message || 'Something went wrong.'
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};

module.exports = errorHandler;
