#!/usr/bin/env node

/**
 * Data Synchronization Script
 * This script helps synchronize employee data across all collections
 * Run this script to fix any data inconsistencies
 */

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_URI.split('/').pop().split('?')[0];

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DB_NAME);
}

async function syncEmployeeData() {
  console.log('🔄 Starting employee data synchronization...');
  
  try {
    const db = await connectToDatabase();
    
    // Get all employees with their user data
    const employees = await db.collection('employees').aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: '$userData'
      },
      {
        $match: {
          'userData.isActive': true
        }
      }
    ]).toArray();

    console.log(`📊 Found ${employees.length} active employees`);

    // Update position email mappings
    let updatedMappings = 0;
    let errors = 0;

    for (const employee of employees) {
      try {
        const fullName = `${employee.userData.firstName || ''} ${employee.userData.lastName || ''}`.trim();
        
        if (!fullName || fullName === ' ') {
          console.log(`⚠️  Employee ${employee.employeeId} has incomplete name: "${employee.userData.firstName}" "${employee.userData.lastName}"`);
          continue;
        }

        // Update position email mappings by email
        const emailUpdateResult = await db.collection('positionemailmappings').updateMany(
          {
            email: employee.userData.email,
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

        // Update position email mappings by position and approximate name match
        const nameUpdateResult = await db.collection('positionemailmappings').updateMany(
          {
            position: employee.position,
            employeeName: { 
              $regex: new RegExp(`^${escapeRegex(employee.userData.firstName || '')}\\s+${escapeRegex(employee.userData.lastName || '')}$`, 'i') 
            },
            isActive: true
          },
          {
            $set: {
              employeeName: fullName,
              updatedAt: new Date()
            }
          }
        );

        const totalUpdated = Math.max(emailUpdateResult.modifiedCount, nameUpdateResult.modifiedCount);
        if (totalUpdated > 0) {
          console.log(`✅ Updated ${totalUpdated} mappings for ${fullName} (${employee.userData.email})`);
          updatedMappings += totalUpdated;
        }
      } catch (error) {
        console.error(`❌ Error updating employee ${employee.employeeId}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📈 Synchronization Summary:`);
    console.log(`   - Processed: ${employees.length} employees`);
    console.log(`   - Updated mappings: ${updatedMappings}`);
    console.log(`   - Errors: ${errors}`);

    // Find and report orphaned mappings
    console.log('\n🔍 Checking for orphaned mappings...');
    const orphanedMappings = await findOrphanedMappings(db);
    
    if (orphanedMappings.length > 0) {
      console.log(`⚠️  Found ${orphanedMappings.length} orphaned mappings:`);
      orphanedMappings.forEach(mapping => {
        console.log(`   - ${mapping.email} (${mapping.position}): ${mapping.employeeName}`);
      });
      
      // Optionally deactivate orphaned mappings
      const deactivateResult = await db.collection('positionemailmappings').updateMany(
        {
          _id: { $in: orphanedMappings.map(m => m._id) }
        },
        {
          $set: {
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`🧹 Deactivated ${deactivateResult.modifiedCount} orphaned mappings`);
    } else {
      console.log('✅ No orphaned mappings found');
    }

    console.log('\n🎉 Data synchronization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    process.exit(1);
  }
}

async function findOrphanedMappings(db) {
  const mappings = await db.collection('positionemailmappings').find({ isActive: true }).toArray();
  const orphaned = [];

  for (const mapping of mappings) {
    // Check if user exists
    const user = await db.collection('users').findOne({ email: mapping.email });
    
    if (!user) {
      orphaned.push(mapping);
      continue;
    }

    // Check if employee exists
    const employee = await db.collection('employees').findOne({ 
      user: user._id,
      isActive: true 
    });

    if (!employee) {
      orphaned.push(mapping);
      continue;
    }

    // Check if position matches
    if (employee.position !== mapping.position) {
      console.log(`📝 Position mismatch for ${mapping.email}: mapping has "${mapping.position}", employee has "${employee.position}"`);
      // This will be fixed by the main sync process, not considered orphaned
    }
  }

  return orphaned;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run the synchronization
if (require.main === module) {
  syncEmployeeData()
    .then(() => {
      console.log('🏁 Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  syncEmployeeData,
  findOrphanedMappings
};
