/**
 * Utility for getting proper robot names
 */
const robotNames = {
  1: 'DJZ Clone 1',
  2: 'DJZ Clone 2',
  3: 'DJZ Clone 3',
  4: 'DJZ Clone 4',
  5: 'DJZ Clone 5',
  6: 'DJZ Clone 6',
  7: 'DJZ Clone 7'
};

/**
 * Get the proper name for a robot
 * @param {number} robotId - Robot ID (1-7)
 * @returns {string} - Proper robot name
 */
function getRobotName(robotId) {
  return robotNames[robotId] || `DJZ Clone ${robotId}`;
}

module.exports = {
  robotNames,
  getRobotName
};
