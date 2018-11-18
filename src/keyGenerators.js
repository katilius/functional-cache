function pickNthArgument(argumentIndex) {
  return function(...args) {
    return args[argumentIndex];
  };
}

function pickField(field) {
  return function(arg) {
    if (arg) {
      return arg[field];
    }
    return undefined;
  };
}

module.exports = {
  pickFirstArgument: pickNthArgument(0),
  pickNthArgument: pickNthArgument,
  pickFirstArgumentField: function(field) {
    return function(...args) {
      return pickField(field)(pickNthArgument(0)(...args));
    };
  }
};
