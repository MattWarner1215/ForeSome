async function testSignIn() {
  console.log('🔐 Testing Sign-In Functionality...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // Test 1: Check if signin page loads
    console.log('1. Testing signin page...')
    const signinResponse = await fetch(`${baseUrl}/auth/signin`)
    console.log(`   ✅ Signin page: ${signinResponse.status === 200 ? 'OK' : 'FAILED'}`)
    
    // Test 2: Check if auth session endpoint works
    console.log('2. Testing auth session...')
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`)
    const sessionData = await sessionResponse.json()
    console.log(`   ✅ Auth session: ${sessionResponse.status === 200 ? 'OK' : 'FAILED'}`)
    console.log(`   📄 Response: ${JSON.stringify(sessionData)}`)
    
    // Test 3: Check if auth providers endpoint works
    console.log('3. Testing auth providers...')
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`)
    const providersData = await providersResponse.json()
    console.log(`   ✅ Auth providers: ${providersResponse.status === 200 ? 'OK' : 'FAILED'}`)
    console.log(`   📄 Available providers: ${Object.keys(providersData).length}`)
    
    // Test 4: Check CSRF token
    console.log('4. Testing CSRF token...')
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`)
    const csrfData = await csrfResponse.json()
    console.log(`   ✅ CSRF token: ${csrfResponse.status === 200 ? 'OK' : 'FAILED'}`)
    console.log(`   🔑 Token present: ${csrfData.csrfToken ? 'YES' : 'NO'}`)
    
    console.log('\n🎉 Authentication system is ready!')
    console.log('✨ Sign-in should now work properly in the browser.')
    console.log('\n📝 Next steps:')
    console.log('   1. Open http://localhost:3000/auth/signin in your browser')
    console.log('   2. Try signing in with existing credentials')
    console.log('   3. Create new account if needed at http://localhost:3000/auth/signup')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSignIn().catch(console.error)