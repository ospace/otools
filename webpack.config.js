const path = require("path");
const argv = require("process").argv;

module.exports = () => {
  const env = argv.indexOf("--env");
  return require(`./webpack.${~env ? argv[env + 1] : "dev"}.js`);
};
