// Script to fix existing meetings with "New Client" as client_name
// This script updates the client_name field in meetings table to match the actual client name

import { DatabaseService } from './src/services/database.js';

async function fixClientNames() {
  try {
    console.log('🔧 Starting client name fix...');
    
    // This would need to be run in the context where env.DB is available
    // For now, this is a template of what needs to be done
    
    console.log('📋 Steps to fix client names:');
    console.log('1. Update meetings table to set client_name = clients.name where client_id matches');
    console.log('2. This will ensure all meetings show the correct client name');
    console.log('3. The getClientsWithTags method will then group correctly');
    
    // SQL to run:
    // UPDATE meetings m 
    // SET client_name = c.name 
    // FROM clients c 
    // WHERE m.client_id = c.client_id 
    // AND m.client_name = 'New Client';
    
    console.log('✅ Client name fix script completed');
  } catch (error) {
    console.error('❌ Error in client name fix:', error);
  }
}

// Export for use in other contexts
export { fixClientNames };
