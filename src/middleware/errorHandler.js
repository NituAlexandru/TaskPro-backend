const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
  
    console.error(err.stack);
  
    res.status(status).json({ message });
  };
  
  const notFoundHandler = (req, res, next) => {
    res.status(404).json({ message: 'Not found' });
  };
  
  export { errorHandler, notFoundHandler };
  