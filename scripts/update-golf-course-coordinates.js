const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// Rate limiting configuration
const RATE_LIMIT_MS = 1500; // 1.5 seconds between requests to be respectful to the API

// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to geocode an address using OpenStreetMap Nominatim API
async function geocodeAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`;

    console.log(`  Geocoding: ${address}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ForeSum Golf App (golf-coordinate-updater)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };
    } else {
      console.log(`    No coordinates found for: ${address}`);
      return null;
    }
  } catch (error) {
    console.error(`    Error geocoding ${address}:`, error.message);
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
    course.phone = course.phone.replace(/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, match => match);
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

// Main function to update golf course coordinates
async function updateGolfCourseCoordinates() {
  try {
    console.log('🏌️ Starting Golf Course Coordinate Update Process...\n');

    // Read the markdown file
    const markdownPath = path.join(__dirname, '..', 'docs', 'Golf courses.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

    console.log('📖 Reading golf courses from markdown file...');
    const courses = parseGolfCourses(markdownContent);
    console.log(`✅ Found ${courses.length} golf courses\n`);

    let updated = 0;
    let created = 0;
    let errors = 0;
    let skipped = 0;

    for (let i = 0; i < courses.length; i++) {
      const course = cleanCourseData(courses[i]);

      console.log(`[${i + 1}/${courses.length}] Processing: ${course.name}`);

      try {
        // Check if course already exists
        const existingCourse = await prisma.golfCourse.findFirst({
          where: {
            name: course.name,
            city: course.city,
            state: course.state
          }
        });

        let coordinates = null;

        // Only geocode if we don't have coordinates
        if (!existingCourse || !existingCourse.latitude || !existingCourse.longitude) {
          coordinates = await geocodeAddress(course.address);

          // Rate limiting to be respectful to the API
          await sleep(RATE_LIMIT_MS);
        } else {
          console.log(`  ✓ Coordinates already exist`);
          skipped++;
          continue;
        }

        if (coordinates) {
          const courseData = {
            name: course.name,
            address: course.address,
            city: course.city,
            state: course.state,
            zipCode: course.zipCode,
            country: course.country,
            phone: course.phone || null,
            website: course.website || null,
            type: course.type,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            features: course.features || null
          };

          if (existingCourse) {
            // Update existing course
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
            console.log(`  ✅ Updated coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
            updated++;
          } else {
            // Create new course
            await prisma.golfCourse.create({
              data: courseData
            });
            console.log(`  ✅ Created with coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
            created++;
          }
        } else {
          console.log(`  ❌ Failed to get coordinates`);

          // Still create/update the course without coordinates if it doesn't exist
          if (!existingCourse) {
            await prisma.golfCourse.create({
              data: {
                name: course.name,
                address: course.address,
                city: course.city,
                state: course.state,
                zipCode: course.zipCode,
                country: course.country,
                phone: course.phone || null,
                website: course.website || null,
                type: course.type,
                features: course.features || null
              }
            });
            console.log(`  ✅ Created course without coordinates`);
            created++;
          }
          errors++;
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${course.name}:`, error.message);
        errors++;
      }

      console.log(''); // Empty line for readability
    }

    console.log('🎯 Process Complete!');
    console.log('==================');
    console.log(`📊 Summary:`);
    console.log(`  • Courses processed: ${courses.length}`);
    console.log(`  • Coordinates updated: ${updated}`);
    console.log(`  • New courses created: ${created}`);
    console.log(`  • Courses skipped (already had coordinates): ${skipped}`);
    console.log(`  • Errors encountered: ${errors}`);

    // Verify final count in database
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
    console.log(`  • Total courses in database: ${totalCourses}`);
    console.log(`  • Courses with coordinates: ${coursesWithCoordinates}`);
    console.log(`  • Courses missing coordinates: ${totalCourses - coursesWithCoordinates}`);

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
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateGolfCourseCoordinates, parseGolfCourses };