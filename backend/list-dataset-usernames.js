#!/usr/bin/env node

/**
 * List all available usernames in the Apify dataset
 */

const API_TOKEN = process.env.APIFY_API_TOKEN
const DATASET_ID = process.env.APIFY_DATASET_ID

if (!API_TOKEN || !DATASET_ID) {
  console.error('❌ Missing environment variables:');
  console.error('   APIFY_API_TOKEN, APIFY_DATASET_ID');
  process.exit(1);
}

async function listUsernames() {
  try {
    console.log('\n📊 Fetching all usernames from Apify dataset...\n');

    const datasetUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${API_TOKEN}`;

    const response = await fetch(datasetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const allItems = await response.json();

    if (!allItems || allItems.length === 0) {
      console.error('❌ No items found in dataset!');
      process.exit(1);
    }

    // Extract unique usernames
    const usernames = [...new Set(allItems.map(item => item.ownerUsername).filter(Boolean))];

    console.log(`✅ Found ${usernames.length} unique usernames in dataset:\n`);
    
    usernames.forEach((username, index) => {
      // Count posts for each username
      const postCount = allItems.filter(item => item.ownerUsername === username).length;
      console.log(`   ${(index + 1).toString().padStart(2)}. @${username} (${postCount} posts)`);
    });

    console.log(`\n📈 Total items in dataset: ${allItems.length}\n`);

    // Show a sample profile data
    if (usernames.length > 0) {
      const firstItem = allItems.find(item => item.ownerUsername === usernames[0]);
      console.log(`📋 Sample data for @${usernames[0]}:\n`);
      console.log({
        username: firstItem.ownerUsername,
        fullName: firstItem.ownerFullName,
        followers: firstItem.ownerFollowers,
        following: firstItem.ownerFollowing,
        postsCount: firstItem.ownerPostsCount,
        biography: (firstItem.ownerBiography || '').substring(0, 100)
      });
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

listUsernames();
