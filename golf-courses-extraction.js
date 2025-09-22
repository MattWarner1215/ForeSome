// Temporary file to help organize golf course data extraction
// This will help systematically process all 179 remaining courses

const golfCourses = [
  // Columbus Municipal Golf Courses (CRPD) - 6 courses
  { name: "Airport Golf Course", category: "municipal", website: "crpdgolf.com", logoAvailable: "CRPD Golf logo" },
  { name: "Champions Golf Course", category: "municipal", website: "crpdgolf.com", logoAvailable: "CRPD Golf logo" },
  { name: "Raymond Memorial Golf Course", category: "municipal", website: "crpdgolf.com", logoAvailable: "CRPD Golf logo" },
  { name: "Mentel Memorial Golf Course", category: "municipal", website: "crpdgolf.com", logoAvailable: "CRPD Golf logo" },
  { name: "Turnberry Golf Course", category: "municipal", website: "crpdgolf.com", logoAvailable: "CRPD Golf logo" },
  { name: "Wilson Road Golf Course", category: "municipal", website: "crpdgolf.com", logoAvailable: "CRPD Golf logo" },

  // Other Columbus Area Public Courses - 4 courses (excluding Cumberland Trail which is done)
  { name: "Minerva Lake Golf Club", category: "public", website: "mineralakegolfclub.com" },
  { name: "Blacklick Woods Golf Course", category: "public", website: "metroparks.net" },
  { name: "Pleasant Valley Golf Course", category: "public", website: "pleasantvalleygolfcourse.net" },
  { name: "Big Walnut Golf Club", category: "semi-private", website: "bigwalnutgolfclub.com" },

  // Columbus Area Private Courses - 5 courses
  { name: "Scioto Country Club", category: "private", website: "sciotocc.org" },
  { name: "Columbus Country Club", category: "private", website: "columbuscc.org" },
  { name: "Muirfield Village Golf Club", category: "private", website: "muirfieldvillage.com", logoAvailable: "Crest logo (.jpg), Wreath logo (.jpg)" },
  { name: "The Ohio State University Golf Club (Scarlet Course)", category: "private", website: "ohiostatebuckeyes.com", logoAvailable: "Ohio State logo (.png)" },
  { name: "Brookside Golf & Country Club", category: "private", website: "brooksidegolf.net" },

  // Central Ohio Public Courses - 14 courses
  { name: "The Virtues Golf Club", category: "public", website: "thevirtuesgolfclub.com" },
  { name: "Golf Club of Dublin", category: "public", website: "golfclubofdublin.com" },
  { name: "Apple Valley Golf Club", category: "public", website: "applevalleygolfclub.com" },
  { name: "Delaware Golf Club", category: "public", website: "delawaregolfclub.com" },
  { name: "Darby Creek Golf Course", category: "public", website: "darbycreekgolf.com" },
  { name: "Deer Creek State Park Golf Course", category: "public", website: "ohiostateparks.gov" },
  { name: "Westchester Golf Course", category: "public", website: "westchestergolfcourse.com" },
  { name: "Forest Hills Golf Course", category: "public", website: "foresthillsgolfcourse.com" },
  { name: "Pine Lakes Golf Course", category: "public", website: "pinelakesgolf.com" },
  { name: "Granville Golf Course", category: "public", website: "granvillegolfcourse.com" },
  { name: "Kinsale Golf & Fitness Club", category: "public", website: "kinsalegolf.com" },
  { name: "Foxfire Golf Club", category: "public", website: "foxfiregolfclub.net" },
  { name: "Northstar Golf Club", category: "public", website: "northstargolfclub.com" },
  { name: "Royal American Links Golf Club", category: "public", website: "royalamericanlinks.com" }
];

console.log("Total courses to process:", golfCourses.length);
console.log("Municipal courses:", golfCourses.filter(c => c.category === 'municipal').length);
console.log("Public courses:", golfCourses.filter(c => c.category === 'public').length);
console.log("Private courses:", golfCourses.filter(c => c.category === 'private').length);
console.log("Semi-private courses:", golfCourses.filter(c => c.category === 'semi-private').length);