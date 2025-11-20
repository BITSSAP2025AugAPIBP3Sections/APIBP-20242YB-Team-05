#!/usr/bin/env node

/**
 * Simple API test script for Search & Discovery service
 * This script tests the basic endpoints to ensure everything is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const API_URL = `${BASE_URL}/api/v1`;

async function testAPI() {
  console.log('🧪 Testing Search & Discovery API\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health check: ${healthResponse.data.status}`);
    console.log(`   Database: ${healthResponse.data.database.status}`);
    console.log(`   Collections: ${healthResponse.data.database.collections?.join(', ')}\n`);

    // Test 2: Root endpoint
    console.log('2️⃣ Testing root endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log(`✅ Root endpoint: ${rootResponse.data.service}`);
    console.log(`   Version: ${rootResponse.data.version}\n`);

    // Test 3: Categories endpoint
    console.log('3️⃣ Testing categories endpoint...');
    const categoriesResponse = await axios.get(`${API_URL}/categories`);
    console.log(`✅ Categories: Found ${categoriesResponse.data.count} categories`);
    categoriesResponse.data.categories.slice(0, 3).forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.productCount} products`);
    });
    console.log('');

    // Test 4: Search endpoint (without query)
    console.log('4️⃣ Testing search endpoint (all products)...');
    const searchResponse = await axios.get(`${API_URL}/search?limit=5`);
    console.log(`✅ Search: Found ${searchResponse.data.pagination.totalResults} total products`);
    console.log(`   Showing ${searchResponse.data.results.length} results:`);
    searchResponse.data.results.forEach(product => {
      console.log(`   - ${product.name} (${product.category}) - $${product.priceUSD}`);
    });
    console.log('');

    // Test 5: Search with query
    console.log('5️⃣ Testing search with query "smartphone"...');
    const queryResponse = await axios.get(`${API_URL}/search?q=smartphone&limit=3`);
    console.log(`✅ Search query: Found ${queryResponse.data.pagination.totalResults} smartphones`);
    queryResponse.data.results.forEach(product => {
      console.log(`   - ${product.name} - $${product.priceUSD}`);
    });
    console.log('');

    // Test 6: Trending products
    console.log('6️⃣ Testing trending products...');
    const trendingResponse = await axios.get(`${API_URL}/search/trending?limit=3`);
    console.log(`✅ Trending: Found ${trendingResponse.data.count} trending products`);
    trendingResponse.data.products.forEach(product => {
      console.log(`   - ${product.name} (Score: ${Math.round(product.trendingScore || 0)})`);
    });
    console.log('');

    // Test 7: Category products
    console.log('7️⃣ Testing category products (electronics)...');
    const categoryProductsResponse = await axios.get(`${API_URL}/categories/electronics/products?limit=3`);
    console.log(`✅ Electronics: Found ${categoryProductsResponse.data.pagination.totalResults} products`);
    categoryProductsResponse.data.results.forEach(product => {
      console.log(`   - ${product.name} - $${product.priceUSD}`);
    });
    console.log('');

    // Test 8: Search suggestions
    console.log('8️⃣ Testing search suggestions...');
    const suggestionsResponse = await axios.get(`${API_URL}/search/suggestions?q=iph`);
    console.log(`✅ Suggestions: Found ${suggestionsResponse.data.suggestions.length} suggestions for "iph"`);
    suggestionsResponse.data.suggestions.forEach(suggestion => {
      console.log(`   - ${suggestion}`);
    });

    console.log('\n🎉 All tests passed! Search & Discovery API is working correctly.');

  } catch (error) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.error?.message || error.response.data.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.error('\n💡 Make sure the API server is running and MongoDB is populated.');
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
