/**
 * Robot naming utilities
 */

const ROBOT_NAMES = {
  1: ':one::robot:',
  2: ':two::robot:',
  3: ':three::robot:',
  4: ':four::robot:',
  5: ':five::robot:',
  6: ':six::robot:',
  7: ':seven::robot:'
};

/**
 * Get the display name for a robot
 * @param {number} robotId - Robot ID (1-7)
 * @returns {string} Robot display name
 */
function getRobotName(robotId) {
  if (robotId < 1 || robotId > 7) {
    throw new Error('Robot ID must be between 1 and 7');
  }
  return ROBOT_NAMES[robotId];
}

/**
 * Get all robot names
 * @returns {Object} Object with robotId as keys and names as values
 */
function getAllRobotNames() {
  return { ...ROBOT_NAMES };
}

/**
 * Validate robot ID
 * @param {number} robotId - Robot ID to validate
 * @returns {boolean} True if valid
 */
function isValidRobotId(robotId) {
  return Number.isInteger(robotId) && robotId >= 1 && robotId <= 7;
}

module.exports = {
  getRobotName,
  getAllRobotNames,
  isValidRobotId,
  ROBOT_NAMES
};
