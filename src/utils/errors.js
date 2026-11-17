class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const badRequest = (message) => new ApiError(400, message);
const notFound = (message) => new ApiError(404, message);

module.exports = { ApiError, badRequest, notFound };
