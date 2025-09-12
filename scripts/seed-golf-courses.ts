import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

const newGolfCourses = [
  {
    name: "Granville Golf Course",
    address: "555 Newark Road",
    city: "Granville",
    state: "OH",
    zipCode: "43023",
    phone: "(740) 587-4653",
    website: "granvillegolf.com",
    type: "Public",
    features: "Historic 1924 course designed by William Watson, challenging tree-lined fairways"
  },
  {
    name: "Apple Valley Golf Club",
    address: "433 Clubhouse Dr",
    city: "Howard",
    state: "OH",
    zipCode: "43028",
    phone: "(740) 599-6227",
    website: "applevalleygolfclub.com",
    type: "Public",
    features: "18-hole championship course in scenic Knox County"
  },
  {
    name: "Black Diamond Golf Club",
    address: "9570 Dustin Rd",
    city: "Millersburg",
    state: "OH",
    zipCode: "44654",
    phone: "(330) 674-4653",
    website: "blackdiamondgolfclub.net",
    type: "Public",
    features: "Links-style course with rolling hills and water features"
  },
  {
    name: "Golf Club of Dublin",
    address: "6100 Dublinshire Dr",
    city: "Dublin",
    state: "OH",
    zipCode: "43017",
    phone: "(614) 764-2372",
    website: "golfclubofdublin.com",
    type: "Private",
    features: "Exclusive private club with championship-caliber course"
  },
  {
    name: "Reeves Golf Course",
    address: "2011 Stringtown Rd",
    city: "Cincinnati",
    state: "OH",
    zipCode: "45215",
    phone: "(513) 821-1493",
    website: null,
    type: "Public",
    features: "Municipal course with mature trees and challenging layout"
  },
  {
    name: "Sharon Woods Golf Course",
    address: "11300 Lebanon Road",
    city: "Sharonville",
    state: "OH",
    zipCode: "45241",
    phone: "(513) 771-1663",
    website: "hamiltoncountyparks.org",
    type: "Public",
    features: "Hamilton County Parks course, family-friendly with practice facilities"
  },
  {
    name: "Timber Creek Golf Course",
    address: "1913 Timber Creek Dr",
    city: "Springboro",
    state: "OH",
    zipCode: "45066",
    phone: "(937) 748-4653",
    website: "timbercreekgc.com",
    type: "Semi-Private",
    features: "Modern course design with water features and sand bunkers"
  },
  {
    name: "Forest Hills Golf Course",
    address: "2500 Cedarville-Yellow Springs Rd",
    city: "Cedarville",
    state: "OH",
    zipCode: "45314",
    phone: "(937) 766-5993",
    website: null,
    type: "Public",
    features: "Challenging 18-hole course near Cedarville University"
  },
  {
    name: "Maple Ridge Golf Course",
    address: "635 Dayton Lebanon Pike",
    city: "Centerville",
    state: "OH",
    zipCode: "45459",
    phone: "(937) 885-1849",
    website: null,
    type: "Public",
    features: "Well-maintained municipal course with tree-lined fairways"
  },
  {
    name: "Yankee Trace Golf Club",
    address: "10000 Yankee Street",
    city: "Centerville",
    state: "OH",
    zipCode: "45458",
    phone: "(937) 438-4653",
    website: "yankeetrace.com",
    type: "Public",
    features: "Two 18-hole courses designed by renowned golf architects"
  },
  {
    name: "Pine Lakes Golf Course",
    address: "1910 Bellefontaine Ave",
    city: "Lima",
    state: "OH",
    zipCode: "45804",
    phone: "(419) 221-1220",
    website: null,
    type: "Public",
    features: "Municipal course with mature pine trees and water hazards"
  },
  {
    name: "Mill Creek Golf Course",
    address: "1001 Wilson Rd",
    city: "Ostrander",
    state: "OH",
    zipCode: "43061",
    phone: "(740) 666-4653",
    website: "millcreekgolfcourse.com",
    type: "Public",
    features: "Scenic Delaware County course with creek running through"
  },
  {
    name: "Shelby Oaks Golf Club",
    address: "775 Olivesburg Rd",
    city: "Shelby",
    state: "OH",
    zipCode: "44875",
    phone: "(419) 347-7827",
    website: null,
    type: "Semi-Private",
    features: "Championship course with challenging greens and fairway bunkers"
  },
  {
    name: "Pipestone Golf Club",
    address: "1279 Miamisburg-Centerville Rd",
    city: "Miamisburg",
    state: "OH",
    zipCode: "45342",
    phone: "(937) 866-4653",
    website: "pipestonegolf.com",
    type: "Public",
    features: "Modern design with strategic water placement and elevation changes"
  },
  {
    name: "Walden Ponds Golf Course",
    address: "22881 Country Club Dr",
    city: "Steubenville",
    state: "OH",
    zipCode: "43952",
    phone: "(740) 266-2265",
    website: null,
    type: "Public",
    features: "Scenic course in Ohio Valley with pond features"
  },
  {
    name: "Cherokee Hills Golf Club",
    address: "2300 Cheshire Rd",
    city: "Delaware",
    state: "OH",
    zipCode: "43015",
    phone: "(740) 548-4653",
    website: null,
    type: "Semi-Private",
    features: "Rolling hills course with challenging doglegs and water features"
  },
  {
    name: "Riverside Golf Course",
    address: "1 Grandview Ave",
    city: "Columbus",
    state: "OH",
    zipCode: "43215",
    phone: "(614) 645-3211",
    website: null,
    type: "Public",
    features: "Historic municipal course along the Scioto River"
  },
  {
    name: "Meadowbrook Golf Course",
    address: "2045 N Ridge Rd",
    city: "Lorain",
    state: "OH",
    zipCode: "44055",
    phone: "(440) 282-4653",
    website: null,
    type: "Public",
    features: "Lake Erie region course with links-style design"
  },
  {
    name: "Green Acres Golf Course",
    address: "3712 Spangler Rd NE",
    city: "Canton",
    state: "OH",
    zipCode: "44721",
    phone: "(330) 492-8580",
    website: null,
    type: "Public",
    features: "Family-owned course with traditional layout and friendly atmosphere"
  },
  {
    name: "Stone Ridge Golf Club",
    address: "1100 Stone Ridge Dr",
    city: "Bowling Green",
    state: "OH",
    zipCode: "43402",
    phone: "(419) 353-2582",
    website: "stoneridgegolfclub.com",
    type: "Public",
    features: "Modern championship course with multiple tee options"
  },
  {
    name: "Tartan Fields Golf Club",
    address: "1153 Tartan Fields Dr",
    city: "Dublin",
    state: "OH",
    zipCode: "43017",
    phone: "(614) 761-0094",
    website: "tartanfields.com",
    type: "Public",
    features: "Scottish-inspired championship course designed by Lohmann Golf Designs, challenging layout with elevation changes and strategic bunkering"
  }
]

async function seedGolfCourses() {
  console.log('Starting to seed new golf courses...')
  
  try {
    for (const course of newGolfCourses) {
      // Check if course already exists
      const existingCourse = await prisma.golfCourse.findFirst({
        where: {
          name: course.name,
          city: course.city,
          state: course.state
        }
      })
      
      if (existingCourse) {
        console.log(`Course ${course.name} already exists, skipping...`)
        continue
      }
      
      // Create the course
      const newCourse = await prisma.golfCourse.create({
        data: course
      })
      
      console.log(`✅ Added ${course.name} in ${course.city}, OH`)
    }
    
    console.log('✅ Golf course seeding completed!')
    
  } catch (error) {
    console.error('❌ Error seeding golf courses:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
seedGolfCourses()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })