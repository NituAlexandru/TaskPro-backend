export const setUpdateOptions = function(next) {
  this.options.runValidators = true;
  next();
};
