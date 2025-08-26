// src/middlewares/ErrorHandler.js

const ErrorHandler = function (err, req, res, next) {
  const errStatus = err.statusCode || 500;
  const errMessage = err.message || 'Something went wrong';
  console.error(`Error- status: ${errStatus}, message: ${errMessage}`)
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMessage,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
})
}

export default ErrorHandler;