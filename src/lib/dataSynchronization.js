// Data Synchronization Utilities
// This file contains utilities to keep employee data synchronized across all collections

import { PositionEmailMapping } from "@/model/PositionEmailMapping";
import { Employee } from "@/model/Employee";
import { User } from "@/model/User";

/**
 * Synchronizes employee name changes across all related collections
 * @param {string} userId - The User ID whose name was changed
 * @param {string} newFirstName - New first name
 * @param {string} newLastName - New last name
 */
export async function synchronizeEmployeeName(userId, newFirstName, newLastName) {
  try {
    console.log(`Synchronizing name change for user ${userId}: ${newFirstName} ${newLastName}`);
    
    const fullName = `${newFirstName} ${newLastName}`.trim();
    
    // Find the employee record to get the current position
    const employee = await Employee.findOne({ user: userId }).select('position');
    if (!employee) {
      console.log(`No employee record found for user ${userId}`);
      return;
    }

    // Update PositionEmailMapping records where this employee's name is stored
    const positionMappingsResult = await PositionEmailMapping.updateMany(
      {
        position: employee.position,
        employeeName: { $regex: new RegExp(`^${escapeRegex(newFirstName)}\\s+${escapeRegex(newLastName)}$`, 'i') }
      },
      {
        $set: {
          employeeName: fullName,
          updatedAt: new Date()
        }
      }
    );

    // Also try to find by old name patterns - this is a bit more complex
    // We'll update any mapping for this position that might have the old name
    const allPositionMappings = await PositionEmailMapping.find({
      position: employee.position,
      isActive: true
    });

    // Get the user's email to help identify which mapping belongs to this user
    const user = await User.findById(userId).select('email');
    if (user) {
      // Update mappings that match this user's email
      await PositionEmailMapping.updateMany(
        {
          position: employee.position,
          email: user.email,
          isActive: true
        },
        {
          $set: {
            employeeName: fullName,
            updatedAt: new Date()
          }
        }
      );
    }

    console.log(`Updated ${positionMappingsResult.modifiedCount} position email mappings for name change`);

    // Note: Tasks, ProjectAssignments, and Permissions use ObjectId references,
    // so they don't need to be updated as they automatically resolve to current data
    
    return {
      success: true,
      positionMappingsUpdated: positionMappingsResult.modifiedCount
    };
  } catch (error) {
    console.error('Error synchronizing employee name:', error);
    throw error;
  }
}

/**
 * Synchronizes employee position changes across all related collections
 * @param {string} userId - The User ID whose position was changed
 * @param {string} oldPosition - The old position
 * @param {string} newPosition - The new position
 */
export async function synchronizeEmployeePosition(userId, oldPosition, newPosition) {
  try {
    console.log(`Synchronizing position change for user ${userId}: ${oldPosition} -> ${newPosition}`);

    // Get user details for name matching
    const user = await User.findById(userId).select('firstName lastName email');
    if (!user) {
      console.log(`No user found with ID ${userId}`);
      return;
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Update PositionEmailMapping records
    // First, try to find mappings by email (most reliable)
    const emailMappingsResult = await PositionEmailMapping.updateMany(
      {
        email: user.email,
        position: oldPosition,
        isActive: true
      },
      {
        $set: {
          position: newPosition,
          updatedAt: new Date()
        }
      }
    );

    // Also try to find by name and old position (as backup)
    const nameMappingsResult = await PositionEmailMapping.updateMany(
      {
        employeeName: fullName,
        position: oldPosition,
        isActive: true
      },
      {
        $set: {
          position: newPosition,
          updatedAt: new Date()
        }
      }
    );

    const totalUpdated = Math.max(emailMappingsResult.modifiedCount, nameMappingsResult.modifiedCount);
    console.log(`Updated ${totalUpdated} position email mappings for position change`);

    return {
      success: true,
      positionMappingsUpdated: totalUpdated
    };
  } catch (error) {
    console.error('Error synchronizing employee position:', error);
    throw error;
  }
}

/**
 * Performs a full synchronization of employee data across all collections
 * @param {string} userId - The User ID to synchronize
 */
export async function fullEmployeeDataSync(userId) {
  try {
    console.log(`Performing full data sync for user ${userId}`);

    // Get current user and employee data
    const user = await User.findById(userId).select('firstName lastName email');
    const employee = await Employee.findOne({ user: userId }).select('position');

    if (!user || !employee) {
      console.log(`Missing user or employee data for ${userId}`);
      return;
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Update all PositionEmailMapping records for this user
    const result = await PositionEmailMapping.updateMany(
      {
        $or: [
          { email: user.email },
          { 
            employeeName: { 
              $regex: new RegExp(`^${escapeRegex(user.firstName)}\\s+${escapeRegex(user.lastName)}$`, 'i') 
            }
          }
        ],
        isActive: true
      },
      {
        $set: {
          employeeName: fullName,
          position: employee.position,
          updatedAt: new Date()
        }
      }
    );

    console.log(`Full sync updated ${result.modifiedCount} records`);

    return {
      success: true,
      recordsUpdated: result.modifiedCount
    };
  } catch (error) {
    console.error('Error in full employee data sync:', error);
    throw error;
  }
}

/**
 * Escapes special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Batch synchronization for multiple employees
 * @param {Array} userIds - Array of user IDs to synchronize
 */
export async function batchSynchronizeEmployees(userIds) {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const result = await fullEmployeeDataSync(userId);
      results.push({ userId, ...result });
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Cleanup orphaned PositionEmailMapping records
 * This function removes mappings for employees that no longer exist
 */
export async function cleanupOrphanedMappings() {
  try {
    console.log('Starting cleanup of orphaned position email mappings...');

    // Get all active position email mappings
    const mappings = await PositionEmailMapping.find({ isActive: true });
    const orphanedMappings = [];

    for (const mapping of mappings) {
      // Try to find a user with this email
      const user = await User.findOne({ email: mapping.email });
      
      if (user) {
        // Check if the user has an employee record
        const employee = await Employee.findOne({ user: user._id });
        
        if (!employee) {
          // User exists but no employee record
          orphanedMappings.push(mapping._id);
        } else if (employee.position !== mapping.position) {
          // Position mismatch - this mapping is outdated
          console.log(`Found position mismatch for ${mapping.email}: mapping has ${mapping.position}, employee has ${employee.position}`);
          
          // Update the mapping instead of deleting it
          await PositionEmailMapping.findByIdAndUpdate(mapping._id, {
            position: employee.position,
            employeeName: `${user.firstName} ${user.lastName}`.trim(),
            updatedAt: new Date()
          });
        }
      } else {
        // No user found with this email
        orphanedMappings.push(mapping._id);
      }
    }

    // Deactivate orphaned mappings instead of deleting them
    if (orphanedMappings.length > 0) {
      await PositionEmailMapping.updateMany(
        { _id: { $in: orphanedMappings } },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date() 
          } 
        }
      );
      console.log(`Deactivated ${orphanedMappings.length} orphaned position email mappings`);
    }

    return {
      success: true,
      orphanedMappingsFound: orphanedMappings.length,
      orphanedMappingsDeactivated: orphanedMappings.length
    };
  } catch (error) {
    console.error('Error cleaning up orphaned mappings:', error);
    throw error;
  }
}
