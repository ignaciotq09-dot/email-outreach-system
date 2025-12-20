#!/usr/bin/env node
// Real-time test with immediate monitoring

import WebSocket from 'ws';

async function testRealtime() {
  const API_BASE = 'http://localhost:5000/api';
  
  console.log('🚀 REAL-TIME EMAIL TEST\n');
  
  // 1. Set up WebSocket FIRST
  console.log('🔄 Connecting to WebSocket...');
  const ws = new WebSocket('ws://localhost:5000/ws/email-progress');
  
  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('✅ WebSocket connected\n');
      resolve(true);
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
  });
  
  // Listen to all events
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log(`📨 [${message.type}]`, JSON.stringify(message.data, null, 2));
  });
  
  // 2. Get contacts
  console.log('📊 Fetching contacts...');
  const contactsResponse = await fetch(`${API_BASE}/contacts/all`);
  const contacts = await contactsResponse.json();
  console.log(`✅ Found ${contacts.length} contacts\n`);
  
  if (contacts.length === 0) {
    console.log('❌ No contacts available');
    process.exit(1);
  }
  
  // 3. Send to 10 contacts
  const testSize = Math.min(10, contacts.length);
  const contactIds = contacts.slice(0, testSize).map((c: any) => c.id);
  
  console.log(`🚀 Sending to ${testSize} contacts...\n`);
  
  const response = await fetch(`${API_BASE}/bulk/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      variant: {
        approach: 'Test',
        subject: 'Test Email {name}',
        body: 'Hi {name},\n\nThis is a test email to {company}.\n\nBest,\nTest'
      },
      contactIds: contactIds,
      priority: 10
    })
  });
  
  const result = await response.json();
  console.log('📬 Request result:', JSON.stringify(result, null, 2));
  console.log('\n⏱️  Waiting 60 seconds to monitor processing...\n');
  console.log('='.repeat(60) + '\n');
  
  // Monitor for 60 seconds
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Final status
  const statusResponse = await fetch(`${API_BASE}/bulk/status`);
  const finalStatus = await statusResponse.json();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 FINAL STATUS:');
  console.log(JSON.stringify(finalStatus, null, 2));
  
  ws.close();
  process.exit(0);
}

testRealtime().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});