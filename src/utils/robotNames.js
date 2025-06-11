/**
 * Utility for getting proper robot emoji names
 */
const robotNames = {
  1: ':one::robot:',
  2: ':two::robot:',
  3: ':three::robot:',
  4: ':four::robot:',
  5: ':five::robot:',
  6: ':six::robot:',
  7: ':seven::robot:'
};

/**
 * Get the proper emoji name for a robot
 * @param {number} robotId - Robot ID (1-7)
 * @returns {string} - Proper robot emoji name
 */
function getRobotName(robotId) {
  return robotNames[robotId] || `:${robotId}::robot:`;
}

module.exports = {
  robotNames,
  getRobotName
};
