const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = 25; // Process courses in batches
const RATE_LIMIT_MS = 1000; // 1 second between requests
const RETRY_DELAY = 2000; // 2 seconds delay on retry

// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to geocode an address using OpenStreetMap Nominatim API
async function geocodeAddress(address, retryCount = 0) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ForeSum Golf App (golf-coordinate-updater)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        console.log(`    Rate limited, retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
        return geocodeAddress(address, retryCount + 1);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name
      };
    } else {
      return null;
    }
  } catch (error) {
    if (retryCount < 2) {
      console.log(`    Error, retrying: ${error.message}`);
      await sleep(RETRY_DELAY);
      return geocodeAddress(address, retryCount + 1);
    }
    console.error(`    Final error geocoding ${address}:`, error.message);
    return null;
  }
}

// Function to parse course data from markdown content
function parseGolfCourses(markdownContent) {
  const courses = [];
  const lines = markdownContent.split('\n');

  let currentCourse = null;
  let courseNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match course headers like "### 1. Airport Golf Course"
    const courseMatch = line.match(/^###\s+(\d+)\.\s+(.+)$/);
    if (courseMatch) {
      // Save previous course if it exists
      if (currentCourse && currentCourse.name && currentCourse.address) {
        courses.push(currentCourse);
      }

      courseNumber = parseInt(courseMatch[1]);
      const courseName = courseMatch[2].trim();

      currentCourse = {
        number: courseNumber,
        name: courseName,
        address: '',
        city: '',
        state: 'OH',
        zipCode: '',
        country: 'USA',
        phone: '',
        website: '',
        type: 'Public',
        features: ''
      };
    }

    // Parse course details
    if (currentCourse && line.startsWith('- **')) {
      if (line.includes('**Address:**')) {
        const addressMatch = line.match(/\*\*Address:\*\*\s*(.+)$/);
        if (addressMatch) {
          currentCourse.address = addressMatch[1].trim();

          // Extract city, state, ZIP from address
          const addressParts = currentCourse.address.split(',');
          if (addressParts.length >= 3) {
            currentCourse.city = addressParts[addressParts.length - 2].trim();
            const stateZip = addressParts[addressParts.length - 1].trim();
            const stateZipMatch = stateZip.match(/([A-Z]{2})\s+(\d{5})/);
            if (stateZipMatch) {
              currentCourse.state = stateZipMatch[1];
              currentCourse.zipCode = stateZipMatch[2];
            }
          }
        }
      }

      if (line.includes('**Phone:**')) {
        const phoneMatch = line.match(/\*\*Phone:\*\*\s*(.+)$/);
        if (phoneMatch) {
          currentCourse.phone = phoneMatch[1].trim();
        }
      }

      if (line.includes('**Website:**')) {
        const websiteMatch = line.match(/\*\*Website:\*\*\s*(.+)$/);
        if (websiteMatch) {
          currentCourse.website = websiteMatch[1].trim();
        }
      }

      if (line.includes('**Type:**')) {
        const typeMatch = line.match(/\*\*Type:\*\*\s*(.+)$/);
        if (typeMatch) {
          currentCourse.type = typeMatch[1].trim();
        }
      }

      if (line.includes('**Features:**')) {
        const featuresMatch = line.match(/\*\*Features:\*\*\s*(.+)$/);
        if (featuresMatch) {
          currentCourse.features = featuresMatch[1].trim();
        }
      }
    }
  }

  // Add the last course
  if (currentCourse && currentCourse.name && currentCourse.address) {
    courses.push(currentCourse);
  }

  return courses;
}

// Function to clean and validate course data
function cleanCourseData(course) {
  // Clean phone number
  if (course.phone) {
    course.phone = course.phone.replace(/[^\d\(\)\-\.\s]/g, '');
  }

  // Clean website
  if (course.website && !course.website.startsWith('http')) {
    course.website = 'https://' + course.website;
  }

  // Ensure required fields
  if (!course.city && course.address) {
    const addressParts = course.address.split(',');
    if (addressParts.length >= 2) {
      course.city = addressParts[addressParts.length - 2].trim();
    }
  }

  return course;
}

// Process a batch of golf courses
async function processBatch(courses, startIndex, batchSize) {
  const endIndex = Math.min(startIndex + batchSize, courses.length);
  const batch = courses.slice(startIndex, endIndex);

  console.log(`\n🏌️ Processing batch ${Math.floor(startIndex / batchSize) + 1}: courses ${startIndex + 1}-${endIndex}`);

  let updated = 0;
  let created = 0;
  let errors = 0;
  let skipped = 0;

  for (let i = 0; i < batch.length; i++) {
    const course = cleanCourseData(batch[i]);
    const globalIndex = startIndex + i;

    console.log(`[${globalIndex + 1}/${courses.length}] ${course.name}`);

    try {
      // Check if course already exists
      const existingCourse = await prisma.golfCourse.findFirst({
        where: {
          name: course.name,
          city: course.city || { contains: course.name.split(' ')[0] }
        }
      });

      let coordinates = null;

      // Only geocode if we don't have coordinates
      if (!existingCourse || !existingCourse.latitude || !existingCourse.longitude) {
        console.log(`  📍 Geocoding: ${course.address}`);
        coordinates = await geocodeAddress(course.address);

        // Rate limiting
        await sleep(RATE_LIMIT_MS);
      } else {
        console.log(`  ✓ Already has coordinates`);
        skipped++;
        continue;
      }

      const courseData = {
        name: course.name,
        address: course.address,
        city: course.city || course.name.split(' ')[0], // fallback
        state: course.state,
        zipCode: course.zipCode,
        country: course.country,
        phone: course.phone || null,
        website: course.website || null,
        type: course.type,
        features: course.features || null
      };

      if (coordinates) {
        courseData.latitude = coordinates.latitude;
        courseData.longitude = coordinates.longitude;

        if (existingCourse) {
          await prisma.golfCourse.update({
            where: { id: existingCourse.id },
            data: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              phone: courseData.phone,
              website: courseData.website,
              features: courseData.features
            }
          });
          console.log(`  ✅ Updated: ${coordinates.latitude}, ${coordinates.longitude}`);
          updated++;
        } else {
          await prisma.golfCourse.create({ data: courseData });
          console.log(`  ✅ Created: ${coordinates.latitude}, ${coordinates.longitude}`);
          created++;
        }
      } else {
        console.log(`  ❌ No coordinates found`);

        if (!existingCourse) {
          await prisma.golfCourse.create({ data: courseData });
          console.log(`  ✅ Created without coordinates`);
          created++;
        }
        errors++;
      }

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors++;
    }
  }

  return { updated, created, errors, skipped };
}

// Main function
async function updateGolfCourseCoordinates() {
  try {
    console.log('🏌️ Starting Golf Course Coordinate Update (Batch Mode)...\n');

    // Read the markdown file
    const markdownPath = path.join(__dirname, '..', 'docs', 'Golf courses.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

    console.log('📖 Parsing golf courses from markdown...');
    const courses = parseGolfCourses(markdownContent);
    console.log(`✅ Found ${courses.length} golf courses`);

    let totalStats = { updated: 0, created: 0, errors: 0, skipped: 0 };

    // Process in batches
    for (let startIndex = 0; startIndex < courses.length; startIndex += BATCH_SIZE) {
      const batchStats = await processBatch(courses, startIndex, BATCH_SIZE);

      // Update totals
      totalStats.updated += batchStats.updated;
      totalStats.created += batchStats.created;
      totalStats.errors += batchStats.errors;
      totalStats.skipped += batchStats.skipped;

      // Progress update
      const processed = Math.min(startIndex + BATCH_SIZE, courses.length);
      console.log(`\n📊 Progress: ${processed}/${courses.length} courses processed`);
      console.log(`   Updated: ${totalStats.updated}, Created: ${totalStats.created}, Skipped: ${totalStats.skipped}, Errors: ${totalStats.errors}`);

      // Longer pause between batches
      if (startIndex + BATCH_SIZE < courses.length) {
        console.log(`\n⏸️  Pausing 3 seconds before next batch...`);
        await sleep(3000);
      }
    }

    console.log('\n🎯 Final Results');
    console.log('=================');
    console.log(`📊 Courses processed: ${courses.length}`);
    console.log(`✅ Coordinates updated: ${totalStats.updated}`);
    console.log(`➕ New courses created: ${totalStats.created}`);
    console.log(`⏭️  Courses skipped: ${totalStats.skipped}`);
    console.log(`❌ Errors encountered: ${totalStats.errors}`);

    // Database verification
    const totalCourses = await prisma.golfCourse.count();
    const coursesWithCoordinates = await prisma.golfCourse.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    });

    console.log(`\n📈 Database Status:`);
    console.log(`   Total courses: ${totalCourses}`);
    console.log(`   With coordinates: ${coursesWithCoordinates}`);
    console.log(`   Missing coordinates: ${totalCourses - coursesWithCoordinates}`);
    console.log(`   Success rate: ${((coursesWithCoordinates / totalCourses) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  updateGolfCourseCoordinates()
    .then(() => {
      console.log('\n✅ Batch processing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateGolfCourseCoordinates, parseGolfCourses };