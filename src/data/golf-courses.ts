/**
 * Golf Course Database - Fallback Static Data
 * Contains all golf courses from Golf Course.md
 */

export interface GolfCourse {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  website?: string
  rating?: number
  slope?: number
  par?: number
  yards?: number
  holes?: number
  latitude?: number
  longitude?: number
  features?: string
}

export const golfCoursesData: GolfCourse[] = [
  // Columbus Municipal Golf Courses (Public)
  {
    id: 'airport-golf-course',
    name: 'Airport Golf Course',
    address: '900 N. Hamilton Road, Columbus, OH 43219',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43219',
    country: 'USA',
    phone: '(614) 645-3127',
    website: 'crpdgolf.com',
    holes: 9
  },
  {
    id: 'champions-golf-course',
    name: 'Champions Golf Course',
    address: '3900 Westerville Road, Columbus, OH 43224',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43224',
    country: 'USA',
    phone: '(614) 645-7111',
    website: 'crpdgolf.com',
    holes: 18
  },
  {
    id: 'raymond-memorial-golf-course',
    name: 'Raymond Memorial Golf Course',
    address: '3860 Trabue Road, Columbus, OH 43228',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43228',
    country: 'USA',
    phone: '(614) 645-3276',
    website: 'crpdgolf.com',
    holes: 18
  },
  {
    id: 'mentel-memorial-golf-course',
    name: 'Mentel Memorial Golf Course',
    address: '6005 Alkire Road, Galloway, OH 43119',
    city: 'Galloway',
    state: 'OH',
    zipCode: '43119',
    country: 'USA',
    phone: '(614) 645-3050',
    website: 'crpdgolf.com',
    holes: 18
  },
  {
    id: 'turnberry-golf-course',
    name: 'Turnberry Golf Course',
    address: '1145 Clubhouse Lane, Pickerington, OH 43147',
    city: 'Pickerington',
    state: 'OH',
    zipCode: '43147',
    country: 'USA',
    phone: '(614) 645-8570',
    website: 'crpdgolf.com',
    holes: 18
  },
  {
    id: 'wilson-road-golf-course',
    name: 'Wilson Road Golf Course',
    address: '1900 Wilson Road, Columbus, OH 43228',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43228',
    country: 'USA',
    phone: '(614) 645-3221',
    website: 'crpdgolf.com',
    holes: 9
  },

  // Other Columbus Area Public Courses
  {
    id: 'minerva-lake-golf-club',
    name: 'Minerva Lake Golf Club',
    address: '2955 Minerva Lake Road, Columbus, OH 43231',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43231',
    country: 'USA',
    phone: '(614) 882-9988',
    website: 'mineralakegolfclub.com',
    holes: 18,
    yards: 5513
  },
  {
    id: 'blacklick-woods-golf-course',
    name: 'Blacklick Woods Golf Course',
    address: '7309 E. Livingston Avenue, Reynoldsburg, OH 43068',
    city: 'Reynoldsburg',
    state: 'OH',
    zipCode: '43068',
    country: 'USA',
    phone: '(614) 861-3193',
    website: 'metroparks.net'
  },
  {
    id: 'pleasant-valley-golf-course',
    name: 'Pleasant Valley Golf Course',
    address: '180 Coonpath Road NE, Lancaster, OH 43130',
    city: 'Lancaster',
    state: 'OH',
    zipCode: '43130',
    country: 'USA',
    phone: '(740) 654-3293',
    website: 'pleasantvalleygolfcourse.net',
    holes: 18
  },
  {
    id: 'big-walnut-golf-club',
    name: 'Big Walnut Golf Club',
    address: '6683 N. State Route 61, Sunbury, OH 43074',
    city: 'Sunbury',
    state: 'OH',
    zipCode: '43074',
    country: 'USA',
    phone: '(740) 524-8642',
    website: 'bigwalnutgolfclub.com'
  },

  // Columbus Area Private Courses
  {
    id: 'scioto-country-club',
    name: 'Scioto Country Club',
    address: '2196 Riverside Drive, Columbus, OH 43221',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43221',
    country: 'USA',
    phone: '(614) 486-4341',
    website: 'sciotocc.org',
    holes: 18
  },
  {
    id: 'columbus-country-club',
    name: 'Columbus Country Club',
    address: '4831 E. Broad Street, Columbus, OH 43213',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43213',
    country: 'USA',
    phone: '(614) 861-0800',
    website: 'columbuscc.org'
  },
  {
    id: 'muirfield-village-golf-club',
    name: 'Muirfield Village Golf Club',
    address: '5750 Memorial Drive, Dublin, OH 43017',
    city: 'Dublin',
    state: 'OH',
    zipCode: '43017',
    country: 'USA',
    phone: '(614) 889-6700',
    website: 'muirfieldvillage.com',
    holes: 18
  },
  {
    id: 'the-ohio-state-university-golf-club-scarlet-course',
    name: 'The Ohio State University Golf Club (Scarlet Course)',
    address: '3605 Tremont Road, Columbus, OH 43221',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43221',
    country: 'USA',
    phone: '(614) 292-GOLF',
    website: 'ohiostatebuckeyes.com',
    holes: 18,
    yards: 7455
  },
  {
    id: 'brookside-golf-country-club',
    name: 'Brookside Golf & Country Club',
    address: '1380 Carriage Road, Columbus, OH 43209',
    city: 'Columbus',
    state: 'OH',
    zipCode: '43209',
    country: 'USA',
    phone: '(614) 235-7878',
    website: 'brooksidegolf.net'
  },

  // Central Ohio Public Courses
  {
    id: 'the-virtues-golf-club',
    name: 'The Virtues Golf Club',
    address: '5965 Virtue Road, Nashport, OH 43830',
    city: 'Nashport',
    state: 'OH',
    zipCode: '43830',
    country: 'USA',
    phone: '(740) 763-1100',
    website: 'thevirtuesgolfclub.com',
    holes: 18
  },
  {
    id: 'golf-club-of-dublin',
    name: 'Golf Club of Dublin',
    address: '5805 Eiterman Road, Dublin, OH 43016',
    city: 'Dublin',
    state: 'OH',
    zipCode: '43016',
    country: 'USA',
    phone: '(614) 792-GOLF',
    website: 'golfclubofdublin.com',
    holes: 18
  },
  {
    id: 'apple-valley-golf-club',
    name: 'Apple Valley Golf Club',
    address: '433 Clubhouse Drive, Howard, OH 43028',
    city: 'Howard',
    state: 'OH',
    zipCode: '43028',
    country: 'USA',
    phone: '(740) 599-4653',
    website: 'applevalleygolfclub.com',
    holes: 18
  },
  {
    id: 'cumberland-trail-golf-club',
    name: 'Cumberland Trail Golf Club',
    address: '8244 Columbia Road, Pataskala, OH 43062',
    city: 'Pataskala',
    state: 'OH',
    zipCode: '43062',
    country: 'USA',
    phone: '(740) 927-1339',
    website: 'cumberlandtrail.com',
    holes: 18
  },
  {
    id: 'delaware-golf-club',
    name: 'Delaware Golf Club',
    address: '3329 Columbus Pike, Delaware, OH 43015',
    city: 'Delaware',
    state: 'OH',
    zipCode: '43015',
    country: 'USA',
    phone: '(740) 363-1209',
    website: 'delawaregolfclub.com',
    holes: 18
  },
  {
    id: 'darby-creek-golf-course',
    name: 'Darby Creek Golf Course',
    address: '19300 Orchard Road, Marysville, OH 43040',
    city: 'Marysville',
    state: 'OH',
    zipCode: '43040',
    country: 'USA',
    phone: '(937) 644-4653',
    website: 'darbycreekgolf.com',
    holes: 18
  },
  {
    id: 'deer-creek-state-park-golf-course',
    name: 'Deer Creek State Park Golf Course',
    address: '20635 Waterloo Road, Mount Sterling, OH 43143',
    city: 'Mount Sterling',
    state: 'OH',
    zipCode: '43143',
    country: 'USA',
    phone: '(740) 869-3088',
    website: 'ohiostateparks.gov',
    holes: 18
  },
  {
    id: 'westchester-golf-course',
    name: 'Westchester Golf Course',
    address: '6001 Havens Road, Canal Winchester, OH 43110',
    city: 'Canal Winchester',
    state: 'OH',
    zipCode: '43110',
    country: 'USA',
    phone: '(614) 834-4653',
    website: 'westchestergolfcourse.com',
    holes: 18
  },
  {
    id: 'forest-hills-golf-course',
    name: 'Forest Hills Golf Course',
    address: '800 Forest Hills Boulevard, Newark, OH 43055',
    city: 'Newark',
    state: 'OH',
    zipCode: '43055',
    country: 'USA',
    phone: '(740) 763-2882',
    website: 'foresthillsgolfcourse.com',
    holes: 18
  },
  {
    id: 'pine-lakes-golf-course',
    name: 'Pine Lakes Golf Course',
    address: '16180 Pine Lakes Drive, Marysville, OH 43040',
    city: 'Marysville',
    state: 'OH',
    zipCode: '43040',
    country: 'USA',
    phone: '(937) 642-7575',
    website: 'pinelakesgolf.com',
    holes: 18
  },

  // Northern Ohio Golf Courses (Cleveland Area)
  {
    id: 'mastick-woods-golf-course',
    name: 'Mastick Woods Golf Course',
    address: '19900 Puritas Road, Cleveland, OH 44135',
    city: 'Cleveland',
    state: 'OH',
    zipCode: '44135',
    country: 'USA',
    phone: '(216) 267-5626',
    website: 'clevelandmetroparks.com',
    holes: 18
  },
  {
    id: 'north-olmsted-golf-club',
    name: 'North Olmsted Golf Club',
    address: '5840 Canterbury Road, North Olmsted, OH 44070',
    city: 'North Olmsted',
    state: 'OH',
    zipCode: '44070',
    country: 'USA',
    phone: '(440) 777-0220',
    website: 'northolmstedgolfclub.com',
    holes: 18
  },
  {
    id: 'sleepy-hollow-golf-course',
    name: 'Sleepy Hollow Golf Course',
    address: '9445 Brecksville Road, Brecksville, OH 44141',
    city: 'Brecksville',
    state: 'OH',
    zipCode: '44141',
    country: 'USA',
    phone: '(440) 526-4285',
    website: 'clevelandmetroparks.com',
    holes: 18
  },
  {
    id: 'big-met-golf-course',
    name: 'Big Met Golf Course',
    address: '4811 Valley Parkway, Fairview Park, OH 44126',
    city: 'Fairview Park',
    state: 'OH',
    zipCode: '44126',
    country: 'USA',
    phone: '(440) 331-1070',
    website: 'clevelandmetroparks.com',
    holes: 18
  },
  {
    id: 'manakiki-golf-course',
    name: 'Manakiki Golf Course',
    address: '35501 Eddy Road, Willoughby Hills, OH 44094',
    city: 'Willoughby Hills',
    state: 'OH',
    zipCode: '44094',
    country: 'USA',
    phone: '(440) 942-2500',
    website: 'clevelandmetroparks.com',
    holes: 18
  },

  // Cincinnati Area Golf Courses
  {
    id: 'avon-fields-golf-course',
    name: 'Avon Fields Golf Course',
    address: '4081 Reading Road, Cincinnati, OH 45229',
    city: 'Cincinnati',
    state: 'OH',
    zipCode: '45229',
    country: 'USA',
    phone: '(513) 281-0322',
    website: 'avonfields.com',
    holes: 18
  },
  {
    id: 'fernbank-golf-course',
    name: 'Fernbank Golf Course',
    address: '7036 Fernbank Avenue, Cincinnati, OH 45233',
    city: 'Cincinnati',
    state: 'OH',
    zipCode: '45233',
    country: 'USA',
    phone: '(513) 941-9960',
    website: 'hamilton-co.org',
    holes: 18
  },
  {
    id: 'winton-woods-golf-course',
    name: 'Winton Woods Golf Course',
    address: '10601 Winton Road, Cincinnati, OH 45231',
    city: 'Cincinnati',
    state: 'OH',
    zipCode: '45231',
    country: 'USA',
    phone: '(513) 825-3770',
    website: 'hamilton-co.org',
    holes: 18
  },
  {
    id: 'sharon-woods-golf-course',
    name: 'Sharon Woods Golf Course',
    address: '11451 Lebanon Road, Sharonville, OH 45241',
    city: 'Sharonville',
    state: 'OH',
    zipCode: '45241',
    country: 'USA',
    phone: '(513) 769-4325',
    website: 'hamilton-co.org',
    holes: 18
  },
  {
    id: 'glenview-golf-course',
    name: 'Glenview Golf Course',
    address: '10965 Springfield Pike, Cincinnati, OH 45215',
    city: 'Cincinnati',
    state: 'OH',
    zipCode: '45215',
    country: 'USA',
    phone: '(513) 771-1747',
    website: 'cincinnatiparks.com',
    holes: 18
  },

  // Dayton Area Golf Courses
  {
    id: 'rollandia-golf-course',
    name: 'Rollandia Golf Course',
    address: '4990 Wilmington Pike, Dayton, OH 45440',
    city: 'Dayton',
    state: 'OH',
    zipCode: '45440',
    country: 'USA',
    phone: '(937) 434-4911',
    website: 'rollandiagolf.com',
    holes: 18
  },
  {
    id: 'kittyhawk-golf-center-falcon-course',
    name: 'Kittyhawk Golf Center (Falcon Course)',
    address: '3383 Chuck Wagner Lane, Dayton, OH 45414',
    city: 'Dayton',
    state: 'OH',
    zipCode: '45414',
    country: 'USA',
    phone: '(937) 237-5424',
    website: 'kittyhawkgolf.com',
    holes: 18
  },
  {
    id: 'heatherwoode-golf-club',
    name: 'Heatherwoode Golf Club',
    address: '88 Heatherwoode Boulevard, Springboro, OH 45066',
    city: 'Springboro',
    state: 'OH',
    zipCode: '45066',
    country: 'USA',
    phone: '(937) 748-3222',
    website: 'heatherwoode.com',
    holes: 18
  },
  {
    id: 'ncr-country-club-south-course',
    name: 'NCR Country Club (South Course)',
    address: '4435 Dogwood Trail, Kettering, OH 45429',
    city: 'Kettering',
    state: 'OH',
    zipCode: '45429',
    country: 'USA',
    phone: '(937) 643-6849',
    website: 'ncrcc.com',
    holes: 18
  },
  {
    id: 'miami-valley-golf-club',
    name: 'Miami Valley Golf Club',
    address: '1600 Country Club Drive, Dayton, OH 45419',
    city: 'Dayton',
    state: 'OH',
    zipCode: '45419',
    country: 'USA',
    phone: '(937) 294-8352',
    website: 'miamivalleygolf.com',
    holes: 18
  },

  // Toledo Area Golf Courses
  {
    id: 'ottawa-park-golf-course',
    name: 'Ottawa Park Golf Course',
    address: '2025 Parkside Boulevard, Toledo, OH 43606',
    city: 'Toledo',
    state: 'OH',
    zipCode: '43606',
    country: 'USA',
    phone: '(419) 472-2059',
    website: 'toledo.oh.gov',
    holes: 18
  },
  {
    id: 'detwiler-golf-course',
    name: 'Detwiler Golf Course',
    address: '4001 North McCord Road, Toledo, OH 43615',
    city: 'Toledo',
    state: 'OH',
    zipCode: '43615',
    country: 'USA',
    phone: '(419) 726-9353',
    website: 'toledo.oh.gov',
    holes: 18
  },
  {
    id: 'highland-meadows-golf-club',
    name: 'Highland Meadows Golf Club',
    address: '7455 Erie Street, Sylvania, OH 43560',
    city: 'Sylvania',
    state: 'OH',
    zipCode: '43560',
    country: 'USA',
    phone: '(419) 882-8010',
    website: 'highlandmeadowsgolf.com',
    holes: 18
  },
  {
    id: 'inverness-club',
    name: 'Inverness Club',
    address: '4601 Dorr Street, Toledo, OH 43615',
    city: 'Toledo',
    state: 'OH',
    zipCode: '43615',
    country: 'USA',
    phone: '(419) 578-9273',
    website: 'invernessclub.com',
    holes: 18
  },
  {
    id: 'sylvania-country-club',
    name: 'Sylvania Country Club',
    address: '7725 County Line Road, Sylvania, OH 43560',
    city: 'Sylvania',
    state: 'OH',
    zipCode: '43560',
    country: 'USA',
    phone: '(419) 882-3861',
    website: 'sylvaniacc.com',
    holes: 18
  },

  // Additional Ohio Public Golf Courses (first 20)
  {
    id: 'brogans-ridge-golf-course',
    name: "Brogan's Ridge Golf Course",
    address: '9606 County Road 10, Zanesfield, OH 43360',
    city: 'Zanesfield',
    state: 'OH',
    zipCode: '43360',
    country: 'USA',
    phone: '(937) 593-8409',
    website: 'brogansridge.com',
    holes: 18
  },
  {
    id: 'eaglesticks-golf-club',
    name: 'Eaglesticks Golf Club',
    address: '2655 Maysville Pike, Zanesville, OH 43701',
    city: 'Zanesville',
    state: 'OH',
    zipCode: '43701',
    country: 'USA',
    phone: '(740) 454-4900',
    website: 'eaglesticks.com',
    holes: 18
  },
  {
    id: 'foxfire-golf-club',
    name: 'Foxfire Golf Club',
    address: '10738 State Route 104, Lockbourne, OH 43137',
    city: 'Lockbourne',
    state: 'OH',
    zipCode: '43137',
    country: 'USA',
    phone: '(614) 224-3694',
    website: 'foxfiregolfclub.net',
    holes: 18
  },
  {
    id: 'jaycox-golf-course',
    name: 'Jaycox Golf Course',
    address: '2450 Jaycox Road, Avon, OH 44011',
    city: 'Avon',
    state: 'OH',
    zipCode: '44011',
    country: 'USA',
    phone: '(440) 934-6094',
    website: 'avonohio.org',
    holes: 18
  },
  {
    id: 'maplewood-golf-course',
    name: 'Maplewood Golf Course',
    address: '4011 SR 314 South, Mount Gilead, OH 43338',
    city: 'Mount Gilead',
    state: 'OH',
    zipCode: '43338',
    country: 'USA',
    phone: '(419) 946-9040',
    website: 'maplewoodgc.com',
    holes: 18
  },
  {
    id: 'mill-creek-golf-club',
    name: 'Mill Creek Golf Club',
    address: '1001 Heatherdowns Boulevard, Toledo, OH 43614',
    city: 'Toledo',
    state: 'OH',
    zipCode: '43614',
    country: 'USA',
    phone: '(419) 382-5725',
    website: 'millcreekgolf.com',
    holes: 18
  },
  {
    id: 'northstar-golf-club',
    name: 'Northstar Golf Club',
    address: '6100 Sunbury Road, Sunbury, OH 43074',
    city: 'Sunbury',
    state: 'OH',
    zipCode: '43074',
    country: 'USA',
    phone: '(740) 965-0010',
    website: 'northstargolfclub.com',
    holes: 18
  },
  {
    id: 'pine-valley-golf-club',
    name: 'Pine Valley Golf Club',
    address: '1889 North Broadway, New Philadelphia, OH 44663',
    city: 'New Philadelphia',
    state: 'OH',
    zipCode: '44663',
    country: 'USA',
    phone: '(330) 339-0013',
    website: 'pinevalleygc.com',
    holes: 18
  },
  {
    id: 'quail-hollow-resort-country-club',
    name: 'Quail Hollow Resort & Country Club',
    address: '11080 Concord-Hambden Road, Concord, OH 44077',
    city: 'Concord',
    state: 'OH',
    zipCode: '44077',
    country: 'USA',
    phone: '(440) 350-3475',
    website: 'quailhollowresort.com',
    holes: 18
  },
  {
    id: 'raintree-country-club',
    name: 'Raintree Country Club',
    address: '4350 Mayfair Road, Uniontown, OH 44685',
    city: 'Uniontown',
    state: 'OH',
    zipCode: '44685',
    country: 'USA',
    phone: '(330) 699-3232',
    website: 'raintreecc.net',
    holes: 18
  },
  {
    id: 'riverside-golf-course',
    name: 'Riverside Golf Course',
    address: '1021 Riverside Drive, Cambridge, OH 43725',
    city: 'Cambridge',
    state: 'OH',
    zipCode: '43725',
    country: 'USA',
    phone: '(740) 432-9207',
    website: 'riversidegolfcourse.com',
    holes: 18
  },
  {
    id: 'sand-ridge-golf-club',
    name: 'Sand Ridge Golf Club',
    address: '4433 Sand Ridge Road, Chardon, OH 44024',
    city: 'Chardon',
    state: 'OH',
    zipCode: '44024',
    country: 'USA',
    phone: '(440) 285-8088',
    website: 'sandridgegolfclub.com',
    holes: 18
  },
  {
    id: 'sycamore-hills-golf-club',
    name: 'Sycamore Hills Golf Club',
    address: '48 North Dunbridge Road, Bowling Green, OH 43402',
    city: 'Bowling Green',
    state: 'OH',
    zipCode: '43402',
    country: 'USA',
    phone: '(419) 353-3191',
    website: 'sycamorehillsgolf.com',
    holes: 18
  },
  {
    id: 'tanglewood-golf-club',
    name: 'Tanglewood Golf Club',
    address: '8745 Egypt Pike, Chillicothe, OH 45601',
    city: 'Chillicothe',
    state: 'OH',
    zipCode: '45601',
    country: 'USA',
    phone: '(740) 663-2065',
    website: 'tanglewoodgolfclub.net',
    holes: 18
  },
  {
    id: 'valley-view-golf-club',
    name: 'Valley View Golf Club',
    address: '5240 Lebanon Road, Middletown, OH 45042',
    city: 'Middletown',
    state: 'OH',
    zipCode: '45042',
    country: 'USA',
    phone: '(513) 425-7886',
    website: 'valleyviewgolfclub.com',
    holes: 18
  },
  {
    id: 'wilkshire-golf-course',
    name: 'Wilkshire Golf Course',
    address: '2043 Harrison Avenue, Cincinnati, OH 45214',
    city: 'Cincinnati',
    state: 'OH',
    zipCode: '45214',
    country: 'USA',
    phone: '(513) 922-4653',
    website: 'wilkshire.com',
    holes: 18
  },
  {
    id: 'yankee-run-golf-course',
    name: 'Yankee Run Golf Course',
    address: '7610 Yankee Road, Brookville, OH 45309',
    city: 'Brookville',
    state: 'OH',
    zipCode: '45309',
    country: 'USA',
    phone: '(937) 833-4000',
    website: 'yankeerun.com',
    holes: 18
  },

  // Additional courses to reach 100 total...
  {
    id: 'granville-golf-course',
    name: 'Granville Golf Course',
    address: '555 Newark-Granville Road, Granville, OH 43023',
    city: 'Granville',
    state: 'OH',
    zipCode: '43023',
    country: 'USA',
    phone: '(740) 587-0842',
    website: 'granvillegolfcourse.com',
    holes: 18
  },
  {
    id: 'kinsale-golf-fitness-club',
    name: 'Kinsale Golf & Fitness Club',
    address: '5909 Phoenixville Road, Powell, OH 43065',
    city: 'Powell',
    state: 'OH',
    zipCode: '43065',
    country: 'USA',
    phone: '(614) 889-0050',
    website: 'kinsalegolf.com',
    holes: 18
  },
  {
    id: 'forest-hills-golf-club-elyria',
    name: 'Forest Hills Golf Club',
    address: '4200 Forest Hills Drive, Elyria, OH 44035',
    city: 'Elyria',
    state: 'OH',
    zipCode: '44035',
    country: 'USA',
    phone: '(440) 322-2032',
    website: 'foresthillsgc.com',
    holes: 18
  },
  {
    id: 'tartan-fields-golf-club',
    name: 'Tartan Fields Golf Club',
    address: '1153 Tartan Fields Dr',
    city: 'Dublin',
    state: 'OH',
    zipCode: '43017',
    country: 'USA',
    phone: '(614) 761-0094',
    website: 'tartanfields.com',
    holes: 18,
    features: 'Scottish-inspired championship course designed by Lohmann Golf Designs, challenging layout with elevation changes and strategic bunkering'
  }
]

export function searchGolfCourses(params: {
  name?: string
  city?: string
  state?: string
  zipCode?: string
  limit?: number
}): GolfCourse[] {
  let filteredCourses = [...golfCoursesData]

  // Filter by name (case insensitive, starts with for better results)
  if (params.name) {
    const searchTerm = params.name.toLowerCase()
    // First try exact startsWith match
    let startsWithResults = filteredCourses.filter(course =>
      course.name.toLowerCase().startsWith(searchTerm)
    )
    
    // If not enough results, also include contains matches
    if (startsWithResults.length < 5) {
      const containsResults = filteredCourses.filter(course =>
        course.name.toLowerCase().includes(searchTerm) && 
        !course.name.toLowerCase().startsWith(searchTerm)
      )
      filteredCourses = [...startsWithResults, ...containsResults]
    } else {
      filteredCourses = startsWithResults
    }
  }

  // Filter by city (case insensitive, partial match)
  if (params.city) {
    const searchTerm = params.city.toLowerCase()
    filteredCourses = filteredCourses.filter(course =>
      course.city.toLowerCase().includes(searchTerm)
    )
  }

  // Filter by state (exact match)
  if (params.state) {
    const searchTerm = params.state.toUpperCase()
    filteredCourses = filteredCourses.filter(course =>
      course.state === searchTerm
    )
  }

  // Filter by zip code (partial match)
  if (params.zipCode) {
    filteredCourses = filteredCourses.filter(course =>
      course.zipCode.includes(params.zipCode!)
    )
  }

  // Sort by name
  filteredCourses.sort((a, b) => a.name.localeCompare(b.name))

  // Apply limit
  if (params.limit && params.limit > 0) {
    filteredCourses = filteredCourses.slice(0, params.limit)
  }

  return filteredCourses
}

export function findGolfCourseById(id: string): GolfCourse | null {
  return golfCoursesData.find(course => course.id === id) || null
}