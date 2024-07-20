const errorList = {
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict",
};

const createError = (status, message = errorList[status]) => {
    // Function HttpError creates an error with the specified message
    const error = new Error(message);
    // Adds the status to the error
    error.status = status;
    return error;
};

export default createError;
