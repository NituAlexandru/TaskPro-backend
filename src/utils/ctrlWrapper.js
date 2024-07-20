const ctrlWrapper = (ctrl) => {
    // Create a wrapper function
    return async (req, res, next) => {
      try {
        // Execute the controller function and pass the request and response objects
        await ctrl(req, res, next);
      } catch (error) {
        // Pass any errors to the next middleware (error handler)
        next(error);
      }
    };
  };
  
  export default ctrlWrapper;
  