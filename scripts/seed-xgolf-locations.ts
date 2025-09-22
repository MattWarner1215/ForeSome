import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

const xGolfLocations = [
  {
    name: "X-Golf Columbus",
    address: "1165 Yard Street",
    city: "Grandview Heights",
    state: "OH",
    zipCode: "43212",
    phone: "(614) 549-7119",
    website: "playxgolf.com/locations/columbus",
    type: "Indoor Golf Simulator",
    features: "7 state-of-the-art golf simulators, 7,000 sq ft sports bar, full food & drink menu, league play, private events, golf lessons"
  },
  {
    name: "X-Golf Cincinnati",
    address: "7001 Miami Avenue",
    city: "Madeira",
    state: "OH",
    zipCode: "45243",
    phone: "(513) 538-2007",
    website: "xgolfcincinnati.com",
    type: "Indoor Golf Simulator",
    features: "8 large simulators with seating for 6, full bar and seating area, full kitchen menu, league play, private party room"
  },
  {
    name: "X-Golf Broadview Heights",
    address: "9194 Broadview Road",
    city: "Broadview Heights",
    state: "OH",
    zipCode: "44147",
    phone: "(440) 799-0990",
    website: "playxgolf.com/locations/broadview-heights",
    type: "Indoor Golf Simulator",
    features: "7 indoor golf simulators, Class A PGA Professional instruction, full liquor bar, food service, golf leagues"
  },
  {
    name: "X-Golf Toledo",
    address: "7141 Spring Meadows Drive W",
    city: "Holland",
    state: "OH",
    zipCode: "43528",
    phone: "(419) 867-4653",
    website: "playxgolf.com/locations/toledo",
    type: "Indoor Golf Simulator",
    features: "Year-round indoor golf, premium simulators, full bar and restaurant, league play, private events"
  },
  {
    name: "X-Golf Perrysburg",
    address: "26567 N. Dixie Highway",
    city: "Perrysburg",
    state: "OH",
    zipCode: "43551",
    phone: "(419) 874-4653",
    website: "xgolfperrysburg.com",
    type: "Indoor Golf Simulator",
    features: "Premium indoor golf memberships, leagues, lessons, full service bar and grill"
  },
  {
    name: "X-Golf Solon",
    address: "33615 Aurora Road",
    city: "Solon",
    state: "OH",
    zipCode: "44139",
    phone: "(440) 542-4653",
    website: "playxgolf.com/locations/solon",
    type: "Indoor Golf Simulator",
    features: "State-of-the-art simulators, restaurant and bar, league play, private events, golf instruction"
  },
  {
    name: "X-Golf North Canton",
    address: "4385 Whipple Avenue NW",
    city: "Canton",
    state: "OH",
    zipCode: "44718",
    phone: "(330) 244-4653",
    website: "playxgolf.com/locations/north-canton",
    type: "Indoor Golf Simulator",
    features: "Indoor golf simulators, full service bar and restaurant, leagues, lessons, private parties"
  },
  {
    name: "X-Golf Fairlawn",
    address: "55 Springside Drive",
    city: "Akron",
    state: "OH",
    zipCode: "44333",
    phone: "(330) 666-4653",
    website: "playxgolf.com/locations/fairlawn",
    type: "Indoor Golf Simulator",
    features: "Premium golf simulators, sports bar atmosphere, food and beverages, league play"
  },
  {
    name: "X-Golf Powell",
    address: "W 285 Olentangy Suite 101",
    city: "Powell",
    state: "OH",
    zipCode: "43065",
    phone: "(614) 792-4653",
    website: "playxgolf.com/locations/powell",
    type: "Indoor Golf Simulator",
    features: "Indoor golf simulation technology, full bar and kitchen, leagues, lessons, corporate events"
  }
]

async function seedXGolfLocations() {
  console.log('🏌️‍♂️ Starting to seed X-Golf indoor golf simulator locations...')

  try {
    let addedCount = 0
    let skippedCount = 0

    for (const location of xGolfLocations) {
      // Check if location already exists
      const existingLocation = await prisma.golfCourse.findFirst({
        where: {
          name: location.name,
          city: location.city,
          state: location.state
        }
      })

      if (existingLocation) {
        console.log(`🔄 X-Golf location ${location.name} already exists, skipping...`)
        skippedCount++
        continue
      }

      // Create the X-Golf location
      const newLocation = await prisma.golfCourse.create({
        data: location
      })

      console.log(`✅ Added ${location.name} in ${location.city}, OH`)
      addedCount++
    }

    console.log('\n📊 X-Golf Seeding Summary:')
    console.log(`✅ Successfully added: ${addedCount} locations`)
    console.log(`🔄 Already existed: ${skippedCount} locations`)
    console.log(`🎯 Total X-Golf locations processed: ${xGolfLocations.length}`)

    // Get total golf course count
    const totalCourses = await prisma.golfCourse.count()
    console.log(`📈 Total golf facilities in database: ${totalCourses}`)

    console.log('\n🎉 X-Golf location seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding X-Golf locations:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
seedXGolfLocations()
  .catch((error) => {
    console.error('❌ X-Golf seeding failed:', error)
    process.exit(1)
  })