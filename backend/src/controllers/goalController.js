const { PlayerGoal, Player, User, Session, BatSpeedData, ExitVelocityData } = require('../models');
const { Op } = require('sequelize');

// Create a new goal for a player
const createPlayerGoal = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { goalType, targetValue, startDate, endDate, notes } = req.body;
    const coachId = req.user.id;

    // Validate coach role
    if (req.user.role !== 'coach' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only coaches can create goals for players'
      });
    }

    // Validate required fields
    if (!goalType || !targetValue || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: goalType, targetValue, startDate, endDate'
      });
    }

    // Validate goal type
    const validGoalTypes = ['avg_ev', 'max_ev', 'avg_bs', 'max_bs'];
    if (!validGoalTypes.includes(goalType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid goal type. Must be one of: avg_ev, max_ev, avg_bs, max_bs'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check if player exists
    const player = await Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Create the goal
    const goal = await PlayerGoal.create({
      player_id: playerId,
      coach_id: coachId,
      goal_type: goalType,
      target_value: targetValue,
      start_date: startDate,
      end_date: endDate,
      notes: notes || null,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal
    });

  } catch (error) {
    console.error('Error creating player goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal',
      error: error.message
    });
  }
};

// Get all goals for a player
const getPlayerGoals = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { status } = req.query;

    // Check if player exists
    const player = await Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Build where clause
    const whereClause = { player_id: playerId };
    if (status) {
      whereClause.status = status;
    }

    // Get goals with coach information
    const goals = await PlayerGoal.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name', 'email']
      }, {
        model: Session,
        as: 'achievedSession',
        attributes: ['id', 'session_date', 'session_type']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: goals
    });

  } catch (error) {
    console.error('Error fetching player goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch goals',
      error: error.message
    });
  }
};

// Update a goal
const updatePlayerGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { targetValue, startDate, endDate, notes, status } = req.body;
    const coachId = req.user.id;

    // Validate coach role
    if (req.user.role !== 'coach' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only coaches can update goals'
      });
    }

    // Find the goal
    const goal = await PlayerGoal.findByPk(goalId, {
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name']
      }]
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Check if the user is the coach who created the goal or an admin
    if (goal.coach_id !== coachId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update goals you created'
      });
    }

    // Update the goal
    const updateData = {};
    if (targetValue !== undefined) updateData.target_value = targetValue;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    await goal.update(updateData);

    res.json({
      success: true,
      message: 'Goal updated successfully',
      data: goal
    });

  } catch (error) {
    console.error('Error updating player goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal',
      error: error.message
    });
  }
};

// Delete a goal
const deletePlayerGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const coachId = req.user.id;

    // Validate coach role
    if (req.user.role !== 'coach' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only coaches can delete goals'
      });
    }

    // Find the goal
    const goal = await PlayerGoal.findByPk(goalId, {
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name']
      }]
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Check if the user is the coach who created the goal or an admin
    if (goal.coach_id !== coachId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete goals you created'
      });
    }

    // Delete the goal
    await goal.destroy();

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting player goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal',
      error: error.message
    });
  }
};

// Award milestone for achieving a goal
const awardMilestone = async (req, res) => {
  try {
    const { goalId } = req.params;
    const coachId = req.user.id;

    // Validate coach role
    if (req.user.role !== 'coach' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only coaches can award milestones'
      });
    }

    // Find the goal
    const goal = await PlayerGoal.findByPk(goalId, {
      include: [{
        model: User,
        as: 'coach',
        attributes: ['id', 'name']
      }]
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Check if the user is the coach who created the goal or an admin
    if (goal.coach_id !== coachId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only award milestones for goals you created'
      });
    }

    // Check if goal is achieved
    if (goal.status !== 'achieved') {
      return res.status(400).json({
        success: false,
        message: 'Can only award milestones for achieved goals'
      });
    }

    // Check if milestone already awarded
    if (goal.milestone_awarded) {
      return res.status(400).json({
        success: false,
        message: 'Milestone already awarded for this goal'
      });
    }

    // Award the milestone
    await goal.update({ milestone_awarded: true });

    res.json({
      success: true,
      message: 'Milestone awarded successfully',
      data: goal
    });

  } catch (error) {
    console.error('Error awarding milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award milestone',
      error: error.message
    });
  }
};

// Check and update goal progress (called after session upload)
const checkGoalProgress = async (playerId, sessionId) => {
  try {
    // Get active goals for the player
    const activeGoals = await PlayerGoal.findAll({
      where: {
        player_id: playerId,
        status: 'active'
      }
    });

    if (activeGoals.length === 0) {
      return;
    }

    // Get the session data
    const session = await Session.findByPk(sessionId, {
      include: [{
        model: ExitVelocityData,
        as: 'exitVelocityData'
      }, {
        model: BatSpeedData,
        as: 'batSpeedData'
      }]
    });

    if (!session) {
      return;
    }

    // Calculate session metrics
    const exitVelocitySwings = session.exitVelocityData || [];
    const batSpeedSwings = session.batSpeedData || [];

    const avgEv = exitVelocitySwings.length > 0 
      ? exitVelocitySwings.reduce((sum, swing) => sum + parseFloat(swing.exit_velocity || 0), 0) / exitVelocitySwings.length
      : null;

    const maxEv = exitVelocitySwings.length > 0
      ? Math.max(...exitVelocitySwings.map(swing => parseFloat(swing.exit_velocity || 0)))
      : null;

    const avgBs = batSpeedSwings.length > 0
      ? batSpeedSwings.reduce((sum, swing) => sum + parseFloat(swing.bat_speed || 0), 0) / batSpeedSwings.length
      : null;

    const maxBs = batSpeedSwings.length > 0
      ? Math.max(...batSpeedSwings.map(swing => parseFloat(swing.bat_speed || 0)))
      : null;

    // Check each goal
    for (const goal of activeGoals) {
      let achieved = false;
      let currentValue = null;

      switch (goal.goal_type) {
        case 'avg_ev':
          currentValue = avgEv;
          achieved = avgEv && avgEv >= parseFloat(goal.target_value);
          break;
        case 'max_ev':
          currentValue = maxEv;
          achieved = maxEv && maxEv >= parseFloat(goal.target_value);
          break;
        case 'avg_bs':
          currentValue = avgBs;
          achieved = avgBs && avgBs >= parseFloat(goal.target_value);
          break;
        case 'max_bs':
          currentValue = maxBs;
          achieved = maxBs && maxBs >= parseFloat(goal.target_value);
          break;
      }

      if (achieved) {
        await goal.update({
          status: 'achieved',
          achieved_date: session.session_date,
          achieved_session_id: sessionId
        });

        console.log(`Goal ${goal.id} achieved! Player ${playerId} reached ${goal.target_value} ${goal.goal_type} (actual: ${currentValue})`);
      }
    }

  } catch (error) {
    console.error('Error checking goal progress:', error);
  }
};

module.exports = {
  createPlayerGoal,
  getPlayerGoals,
  updatePlayerGoal,
  deletePlayerGoal,
  awardMilestone,
  checkGoalProgress
}; 