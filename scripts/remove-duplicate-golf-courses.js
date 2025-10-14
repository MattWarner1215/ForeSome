require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicateGolfCourses() {
  try {
    console.log('🏌️ Starting golf course duplicate removal process...\n');

    // First, let's see what we're working with
    const totalCourses = await prisma.golfCourse.count();
    console.log(`📊 Total golf courses in database: ${totalCourses}`);

    const coursesWithCoords = await prisma.golfCourse.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    });
    console.log(`📍 Courses with coordinates: ${coursesWithCoords}`);
    console.log(`❌ Courses without coordinates: ${totalCourses - coursesWithCoords}\n`);

    // Find all unique course names and their counts
    const courseNameCounts = await prisma.golfCourse.groupBy({
      by: ['name'],
      _count: {
        name: true
      },
      having: {
        name: {
          _count: {
            gt: 1
          }
        }
      }
    });

    console.log(`🔍 Found ${courseNameCounts.length} course names with duplicates:`);
    courseNameCounts.forEach(course => {
      console.log(`   - "${course.name}": ${course._count.name} records`);
    });
    console.log('');

    let totalDeleted = 0;
    let processedDuplicates = 0;

    // Process each duplicate course name
    for (const courseGroup of courseNameCounts) {
      const courseName = courseGroup.name;
      processedDuplicates++;

      console.log(`[${processedDuplicates}/${courseNameCounts.length}] Processing: "${courseName}"`);

      // Get all records for this course name, ordered by preference:
      // 1. Records with coordinates first
      // 2. Then by creation date (newest first)
      const duplicateRecords = await prisma.golfCourse.findMany({
        where: { name: courseName },
        orderBy: [
          { latitude: { sort: 'desc', nulls: 'last' } }, // Records with lat/lng first
          { longitude: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' } // Newest first
        ]
      });

      if (duplicateRecords.length <= 1) {
        console.log(`   ⚠️  Only found ${duplicateRecords.length} record(s), skipping...`);
        continue;
      }

      // Keep the first record (best one based on our ordering)
      const recordToKeep = duplicateRecords[0];
      const recordsToDelete = duplicateRecords.slice(1);

      console.log(`   ✅ Keeping: ID ${recordToKeep.id} ${recordToKeep.latitude && recordToKeep.longitude ? `(${recordToKeep.latitude}, ${recordToKeep.longitude})` : '(no coordinates)'}`);
      console.log(`   🗑️  Deleting ${recordsToDelete.length} duplicate(s):`);

      // Delete the duplicate records
      for (const record of recordsToDelete) {
        console.log(`      - ID ${record.id} ${record.latitude && record.longitude ? `(${record.latitude}, ${record.longitude})` : '(no coordinates)'}`);

        await prisma.golfCourse.delete({
          where: { id: record.id }
        });
        totalDeleted++;
      }

      console.log('');
    }

    // Final statistics
    const finalTotalCourses = await prisma.golfCourse.count();
    const finalCoursesWithCoords = await prisma.golfCourse.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    });

    console.log('🎉 Duplicate removal completed!\n');
    console.log('📈 Final Statistics:');
    console.log(`   Total courses removed: ${totalDeleted}`);
    console.log(`   Courses before cleanup: ${totalCourses}`);
    console.log(`   Courses after cleanup: ${finalTotalCourses}`);
    console.log(`   Courses with coordinates: ${finalCoursesWithCoords}`);
    console.log(`   Courses without coordinates: ${finalTotalCourses - finalCoursesWithCoords}`);
    console.log(`   Duplicate groups processed: ${processedDuplicates}`);

    // Verify no duplicates remain
    const remainingDuplicates = await prisma.golfCourse.groupBy({
      by: ['name'],
      _count: {
        name: true
      },
      having: {
        name: {
          _count: {
            gt: 1
          }
        }
      }
    });

    if (remainingDuplicates.length === 0) {
      console.log('\n✅ SUCCESS: No duplicate course names remain in the database!');
    } else {
      console.log(`\n⚠️  WARNING: ${remainingDuplicates.length} duplicate course names still exist:`);
      remainingDuplicates.forEach(course => {
        console.log(`   - "${course.name}": ${course._count.name} records`);
      });
    }

  } catch (error) {
    console.error('❌ Error during duplicate removal:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the cleanup
removeDuplicateGolfCourses()
  .then(() => {
    console.log('\n🏁 Golf course cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Golf course cleanup failed:', error);
    process.exit(1);
  });