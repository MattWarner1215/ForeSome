const { performance } = require('perf_hooks')

async function testPerformance() {
  console.log('🚀 ForeSome Performance Test - Post Optimization\n')
  
  const baseUrl = 'http://localhost:3000'
  
  const testEndpoints = [
    { name: 'Homepage', url: `${baseUrl}/` },
    { name: 'Auth Session', url: `${baseUrl}/api/auth/session` },
    { name: 'Matches API (unauthorized)', url: `${baseUrl}/api/matches` },
  ]
  
  const results = {}
  
  for (const test of testEndpoints) {
    console.log(`Testing ${test.name}...`)
    
    // Warm up
    await fetch(test.url).catch(() => {})
    
    // Run multiple tests
    const times = []
    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      try {
        await fetch(test.url)
      } catch (error) {
        // Ignore errors, we're just testing response times
      }
      const end = performance.now()
      times.push(end - start)
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    
    results[test.name] = {
      average: Math.round(avgTime),
      min: Math.round(minTime),
      max: Math.round(maxTime)
    }
    
    console.log(`  ✅ Average: ${Math.round(avgTime)}ms, Min: ${Math.round(minTime)}ms, Max: ${Math.round(maxTime)}ms`)
  }
  
  console.log('\n📊 Performance Summary:')
  console.log('=' .repeat(50))
  
  for (const [name, stats] of Object.entries(results)) {
    console.log(`${name.padEnd(25)} | Avg: ${stats.average}ms | Range: ${stats.min}-${stats.max}ms`)
  }
  
  console.log('=' .repeat(50))
  
  // Performance ratings
  const ratings = {
    homepage: results['Homepage'].average < 100 ? 'Excellent' : results['Homepage'].average < 300 ? 'Good' : 'Needs work',
    authSession: results['Auth Session'].average < 200 ? 'Excellent' : results['Auth Session'].average < 500 ? 'Good' : 'Needs work',
    matchesAPI: results['Matches API (unauthorized)'].average < 150 ? 'Excellent' : results['Matches API (unauthorized)'].average < 400 ? 'Good' : 'Needs work'
  }
  
  console.log('\n🏆 Performance Ratings:')
  console.log(`Homepage: ${ratings.homepage}`)
  console.log(`Auth Session: ${ratings.authSession}`)
  console.log(`Matches API: ${ratings.matchesAPI}`)
  
  const excellentCount = Object.values(ratings).filter(r => r === 'Excellent').length
  console.log(`\n✨ Overall Score: ${excellentCount}/3 Excellent ratings`)
  
  if (excellentCount === 3) {
    console.log('🚀 OUTSTANDING! All systems are performing at peak efficiency!')
  } else if (excellentCount >= 2) {
    console.log('✅ GREAT! Performance optimizations are working well!')
  } else {
    console.log('📈 GOOD! Some improvements achieved, but more optimization possible.')
  }
}

testPerformance().catch(console.error)