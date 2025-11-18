#!/usr/bin/env node

/**
 * 產生假資料腳本
 * 根據資料庫結構產生完整的測試資料
 * 
 * 使用方法：
 *   node generate-mock-data.js
 * 
 * 或使用 wrangler：
 *   wrangler d1 execute coachdb --file=./generate-mock-data.sql
 */

// 產生 UUID v4
function generateUUID() {
  // 使用 Node.js 內建的 crypto.randomUUID()（Node.js 14.17.0+）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 簡單的 UUID v4 生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 產生隨機日期（過去 N 天內）
function randomDate(daysAgo = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString().split('T')[0]; // YYYY-MM-DD
}

// 產生隨機時間戳
function randomTimestamp(daysAgo = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString();
}

// 假資料模板
const mockData = {
  users: [
    {
      user_id: generateUUID(),
      email: 'coach1@example.com',
      password_hash: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // bcrypt hash for "password123"
      plan: 'pro',
      verified: true,
      onboarding_completed: true,
      last_login: randomTimestamp(1),
      clients_columns_settings: JSON.stringify(['Client Name', 'Email', 'Notes', 'Tags', 'Status']),
      created_at: randomTimestamp(60)
    },
    {
      user_id: generateUUID(),
      email: 'coach2@example.com',
      password_hash: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // bcrypt hash for "password123"
      plan: 'basic',
      verified: true,
      onboarding_completed: true,
      last_login: randomTimestamp(3),
      clients_columns_settings: JSON.stringify(['Client Name', 'Email', 'Status']),
      created_at: randomTimestamp(45)
    },
    {
      user_id: generateUUID(),
      email: 'coach3@example.com',
      password_hash: '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K', // bcrypt hash for "password123"
      plan: 'free',
      verified: true,
      onboarding_completed: false,
      last_login: null,
      clients_columns_settings: null,
      created_at: randomTimestamp(7)
    }
  ],
  
  tags: [
    { name: 'VIP', color: '#FF6B6B' },
    { name: 'High Priority', color: '#4ECDC4' },
    { name: 'Follow Up', color: '#FFE66D' },
    { name: 'New Client', color: '#95E1D3' },
    { name: 'Long Term', color: '#AA96DA' },
    { name: 'Corporate', color: '#FCBAD3' }
  ],
  
  clients: [
    // User 1 的客戶
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techstart.com',
      status: 'Active',
      notes: 'Marketing director at TechStart. Focus on team performance and conversion optimization.',
      source: 'Referral',
      lead_status: 'Converted',
      engagement_type: 'Executive Coaching',
      program: 'Leadership Development',
      start_date: randomDate(90),
      contract_status: 'Active',
      invoice_status: 'Paid',
      tags: ['VIP', 'High Priority']
    },
    {
      name: 'Mike Chen',
      email: 'mike.chen@innovate.com',
      status: 'Active',
      notes: 'Startup founder. Needs help with customer acquisition and scaling.',
      source: 'Website',
      lead_status: 'Converted',
      engagement_type: 'Business Coaching',
      program: 'Growth Strategy',
      start_date: randomDate(60),
      contract_status: 'Active',
      invoice_status: 'Paid',
      tags: ['New Client', 'Follow Up']
    },
    {
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@digitalpro.com',
      status: 'Active',
      notes: 'Team leader struggling with motivation and performance.',
      source: 'LinkedIn',
      lead_status: 'Converted',
      engagement_type: 'Team Leadership',
      program: 'Performance Improvement',
      start_date: randomDate(45),
      contract_status: 'Active',
      invoice_status: 'Sent',
      tags: ['Long Term']
    },
    {
      name: 'Robert Kim',
      email: 'robert.kim@corp.com',
      status: 'Prospect',
      notes: 'Interested in executive coaching. Initial consultation scheduled.',
      source: 'Email Campaign',
      lead_status: 'Qualified',
      engagement_type: 'Executive Coaching',
      program: null,
      start_date: null,
      contract_status: 'Pending',
      invoice_status: 'Pending',
      tags: []
    },
    
    // User 2 的客戶
    {
      name: 'David Wilson',
      email: 'david.wilson@scaleup.com',
      status: 'Active',
      notes: 'Small business owner looking to scale operations.',
      source: 'Referral',
      lead_status: 'Converted',
      engagement_type: 'Business Coaching',
      program: 'Scaling Strategy',
      start_date: randomDate(120),
      contract_status: 'Active',
      invoice_status: 'Paid',
      tags: ['Corporate', 'Long Term']
    },
    {
      name: 'Emma Thompson',
      email: 'emma.thompson@growthco.com',
      status: 'Active',
      notes: 'Career transition from corporate to entrepreneurship.',
      source: 'Website',
      lead_status: 'Converted',
      engagement_type: 'Career Coaching',
      program: 'Transition Support',
      start_date: randomDate(30),
      contract_status: 'Active',
      invoice_status: 'Paid',
      tags: ['Follow Up']
    },
    
    // User 3 的客戶
    {
      name: 'Alex Kim',
      email: 'alex.kim@startup.com',
      status: 'Active',
      notes: 'Startup founder seeking funding guidance.',
      source: 'Social Media',
      lead_status: 'Converted',
      engagement_type: 'Business Coaching',
      program: 'Funding Strategy',
      start_date: randomDate(20),
      contract_status: 'Active',
      invoice_status: 'Pending',
      tags: ['New Client']
    }
  ],
  
  meetings: [
    // User 1 - Sarah Johnson 的會議
    {
      client_name: 'Sarah Johnson',
      meeting_title: 'Initial Discovery Call',
      meeting_date: randomDate(60),
      is_discovery: true,
      analysis_status: 'completed',
      transcript: 'Sarah discussed her team\'s performance challenges and low conversion rates. She mentioned lack of analytics tracking and team training as main concerns.',
      summary: 'Sarah is a marketing director struggling with team performance and low conversion rates. Main issues are lack of analytics tracking and team training.',
      pain_point: 'Lack of proper analytics tracking and team training on digital marketing tools',
      goal: 'Increase conversion rate by 25% this quarter and improve ROI',
      suggestion: 'Implement analytics platform and develop training program',
      sales_technique_advice: 'Ask more specific questions about current analytics setup. Provide data-driven examples of successful implementations.',
      coaching_advice: 'Focus on progress tracking and celebrate small wins. Encourage data-driven decision making.',
      action_items_client: JSON.stringify(['Implement analytics platform', 'Develop training program', 'Set up conversion tracking']),
      action_items_coach: JSON.stringify(['Follow up on implementation', 'Provide additional resources', 'Schedule progress review']),
      mind_map: JSON.stringify({ nodes: [{ id: 'analytics', label: 'Analytics Setup' }, { id: 'training', label: 'Team Training' }] }),
      email_content: 'Thank you for our discussion today. Here are the key action items...',
      resources_list: JSON.stringify(['Analytics Best Practices Guide', 'Team Training Resources']),
      next_meeting_prep: 'Review analytics implementation progress. Discuss training program timeline.',
      additional_notes: 'Sarah is highly motivated and responsive. Good candidate for long-term engagement.',
      provider: 'zoom',
      provider_meeting_id: 'zoom-' + generateUUID(),
      correlation_id: generateUUID()
    },
    {
      client_name: 'Sarah Johnson',
      meeting_title: 'Progress Review Session',
      meeting_date: randomDate(30),
      is_discovery: false,
      analysis_status: 'completed',
      transcript: 'Sarah has implemented basic analytics but needs help with advanced tracking. Team training is progressing well.',
      summary: 'Sarah has implemented basic analytics but needs help with advanced tracking. Team training is progressing well.',
      pain_point: 'Advanced analytics implementation and campaign optimization',
      goal: 'Optimize campaigns using data insights',
      suggestion: 'Implement advanced tracking and optimize campaigns based on data',
      sales_technique_advice: 'Provide specific examples of advanced tracking. Ask about data insights.',
      coaching_advice: 'Celebrate progress made. Focus on next steps for optimization.',
      action_items_client: JSON.stringify(['Implement advanced tracking', 'Optimize campaigns', 'Review performance metrics']),
      action_items_coach: JSON.stringify(['Provide optimization resources', 'Schedule follow-up', 'Monitor progress']),
      mind_map: null,
      email_content: 'Great progress on analytics implementation! Let\'s focus on advanced tracking...',
      resources_list: JSON.stringify(['Advanced Analytics Guide', 'Campaign Optimization Tips']),
      next_meeting_prep: 'Review advanced tracking implementation. Discuss campaign optimization results.',
      additional_notes: 'Conversion rates improved by 15%. On track to reach 25% goal.',
      provider: 'google',
      provider_meeting_id: 'google-' + generateUUID(),
      correlation_id: generateUUID()
    },
    
    // User 1 - Mike Chen 的會議
    {
      client_name: 'Mike Chen',
      meeting_title: 'Sales Strategy Discovery',
      meeting_date: randomDate(50),
      is_discovery: true,
      analysis_status: 'completed',
      transcript: 'Mike discussed his startup\'s customer acquisition challenges. Has great product but marketing strategy needs improvement.',
      summary: 'Mike is a startup founder struggling with customer acquisition. Has great product but marketing strategy needs improvement.',
      pain_point: 'Struggling to scale business with limited customer acquisition',
      goal: 'Increase customer acquisition by 50% in the next quarter',
      suggestion: 'Develop comprehensive marketing strategy and customer acquisition plan',
      sales_technique_advice: 'Ask about current strategy. Explore pain points in detail.',
      coaching_advice: 'Build trust and understand business model. Assess readiness for growth.',
      action_items_client: JSON.stringify(['Develop marketing strategy', 'Create customer acquisition plan', 'Identify target audience']),
      action_items_coach: JSON.stringify(['Research industry best practices', 'Prepare strategy framework', 'Schedule strategy session']),
      mind_map: null,
      email_content: 'Thank you for sharing your challenges. Let\'s develop a comprehensive strategy...',
      resources_list: JSON.stringify(['Marketing Strategy Template', 'Customer Acquisition Guide']),
      next_meeting_prep: 'Review marketing strategy draft. Discuss customer acquisition tactics.',
      additional_notes: 'Mike is tech-savvy but needs marketing guidance. Good potential for growth.',
      provider: 'zoom',
      provider_meeting_id: 'zoom-' + generateUUID(),
      correlation_id: generateUUID()
    },
    
    // User 2 - David Wilson 的會議
    {
      client_name: 'David Wilson',
      meeting_title: 'Business Scaling Discovery',
      meeting_date: randomDate(100),
      is_discovery: true,
      analysis_status: 'completed',
      transcript: 'David discussed scaling challenges for his small business. Needs help with operational efficiency.',
      summary: 'David runs a successful small business but struggles with scaling. Needs help with operational efficiency.',
      pain_point: 'Operational inefficiencies and scaling challenges',
      goal: 'Scale business operations and improve efficiency',
      suggestion: 'Implement operational improvements and scaling strategies',
      sales_technique_advice: 'Understand business model. Explore scaling barriers.',
      coaching_advice: 'Assess current operations. Identify improvement areas.',
      action_items_client: JSON.stringify(['Audit current operations', 'Develop scaling plan', 'Identify bottlenecks']),
      action_items_coach: JSON.stringify(['Research scaling strategies', 'Prepare operational framework', 'Schedule review']),
      mind_map: null,
      email_content: 'Thank you for our discussion. Let\'s focus on operational improvements...',
      resources_list: JSON.stringify(['Scaling Guide', 'Operational Efficiency Checklist']),
      next_meeting_prep: 'Review operational audit results. Discuss scaling strategy.',
      additional_notes: 'David has strong foundation but needs systematic approach to scaling.',
      provider: 'google',
      provider_meeting_id: 'google-' + generateUUID(),
      correlation_id: generateUUID()
    },
    
    // User 3 - Alex Kim 的會議
    {
      client_name: 'Alex Kim',
      meeting_title: 'Startup Funding Discovery',
      meeting_date: randomDate(15),
      is_discovery: true,
      analysis_status: 'pending',
      transcript: 'Alex discussed funding needs for his startup. Needs help with pitch preparation.',
      summary: 'Alex is a startup founder seeking funding. Needs help with pitch preparation and investor relations.',
      pain_point: 'Lack of funding and investor connections',
      goal: 'Secure startup funding and build investor relationships',
      suggestion: 'Develop pitch deck and investor outreach strategy',
      sales_technique_advice: 'Understand business model. Explore funding needs.',
      coaching_advice: 'Assess pitch readiness. Build confidence.',
      action_items_client: JSON.stringify(['Develop pitch deck', 'Create investor list', 'Practice pitch']),
      action_items_coach: JSON.stringify(['Provide pitch resources', 'Schedule pitch practice', 'Review pitch deck']),
      mind_map: null,
      email_content: 'Thank you for sharing your funding goals. Let\'s work on your pitch...',
      resources_list: null,
      next_meeting_prep: 'Review pitch deck draft. Practice pitch delivery.',
      additional_notes: 'Alex is enthusiastic but needs guidance on investor relations.',
      provider: null,
      provider_meeting_id: null,
      correlation_id: null
    }
  ],
  
  instagram_posts: [
    {
      is_favorite: true,
      is_published: true,
      hook: '5 Secrets to Boost Your Team\'s Performance',
      content: 'Want to improve your team\'s performance? Here are 5 proven strategies that successful leaders use...',
      tags: JSON.stringify(['leadership', 'team-performance', 'coaching'])
    },
    {
      is_favorite: false,
      is_published: false,
      hook: 'How to Scale Your Business Without Losing Quality',
      content: 'Scaling your business is exciting, but maintaining quality can be challenging. Here\'s how...',
      tags: JSON.stringify(['business-growth', 'scaling', 'entrepreneurship'])
    }
  ],
  
  reels_ideas: [
    {
      is_favorite: true,
      is_published: false,
      hook: '3 Mistakes That Kill Your Conversion Rate',
      content: 'Are you making these common mistakes? Here\'s how to fix them and boost your conversion rate...',
      tags: JSON.stringify(['marketing', 'conversion', 'tips'])
    },
    {
      is_favorite: false,
      is_published: true,
      hook: 'From Corporate to Entrepreneur: My Journey',
      content: 'Thinking about making the leap? Here\'s what I learned from my transition...',
      tags: JSON.stringify(['career', 'entrepreneurship', 'motivation'])
    }
  ]
};

// 產生 SQL INSERT 語句
function generateSQL() {
  const sql = [];
  
  // 插入 Users
  sql.push('-- Insert Users');
  mockData.users.forEach((user, index) => {
    sql.push(`INSERT INTO users (user_id, email, password_hash, plan, verified, onboarding_completed, last_login, clients_columns_settings, created_at) VALUES (
      '${user.user_id}',
      '${user.email}',
      '${user.password_hash}',
      '${user.plan}',
      ${user.verified},
      ${user.onboarding_completed},
      ${user.last_login ? `'${user.last_login}'` : 'NULL'},
      ${user.clients_columns_settings ? `'${user.clients_columns_settings}'` : 'NULL'},
      '${user.created_at}'
    );`);
  });
  
  // 插入 Tags（為每個 user 創建標籤）
  sql.push('\n-- Insert Tags');
  mockData.users.forEach((user, userIndex) => {
    mockData.tags.forEach((tag, tagIndex) => {
      const tagId = generateUUID();
      sql.push(`INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '${tagId}',
        '${user.user_id}',
        '${tag.name}',
        '${tag.color}',
        '${randomTimestamp(30)}'
      );`);
      // 儲存 tag_id 以便後續使用
      if (!mockData.tags[tagIndex].tagIds) mockData.tags[tagIndex].tagIds = [];
      if (!mockData.tags[tagIndex].tagIds[userIndex]) mockData.tags[tagIndex].tagIds[userIndex] = tagId;
    });
  });
  
  // 插入 Clients（分配給不同的 users）
  sql.push('\n-- Insert Clients');
  const clientUserMapping = [
    { clientIndex: 0, userId: 0 }, // Sarah - User 1
    { clientIndex: 1, userId: 0 }, // Mike - User 1
    { clientIndex: 2, userId: 0 }, // Lisa - User 1
    { clientIndex: 3, userId: 0 }, // Robert - User 1
    { clientIndex: 4, userId: 1 }, // David - User 2
    { clientIndex: 5, userId: 1 }, // Emma - User 2
    { clientIndex: 6, userId: 2 }  // Alex - User 3
  ];
  
  const clientIds = [];
  clientUserMapping.forEach((mapping) => {
    const client = mockData.clients[mapping.clientIndex];
    const userId = mockData.users[mapping.userId].user_id;
    const clientId = generateUUID();
    clientIds.push({ clientId, userId, clientIndex: mapping.clientIndex });
    
    sql.push(`INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      '${clientId}',
      '${userId}',
      '${client.name}',
      '${client.email}',
      '${client.status}',
      '${client.notes.replace(/'/g, "''")}',
      '${client.source}',
      '${client.lead_status}',
      '${client.engagement_type}',
      ${client.program ? `'${client.program}'` : 'NULL'},
      ${client.start_date ? `'${client.start_date}'` : 'NULL'},
      '${client.contract_status}',
      '${client.invoice_status}',
      '${randomTimestamp(90)}',
      ${Math.floor(Math.random() * 10) + 1}
    );`);
    
    // 插入 client_tags
    if (client.tags && client.tags.length > 0) {
      client.tags.forEach((tagName) => {
        const tagIndex = mockData.tags.findIndex(t => t.name === tagName);
        if (tagIndex >= 0 && mockData.tags[tagIndex].tagIds && mockData.tags[tagIndex].tagIds[mapping.userId]) {
          const tagId = mockData.tags[tagIndex].tagIds[mapping.userId];
          sql.push(`INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            '${generateUUID()}',
            '${clientId}',
            '${tagId}',
            '${randomTimestamp(30)}'
          );`);
        }
      });
    }
  });
  
  // 插入 Meetings
  sql.push('\n-- Insert Meetings');
  const meetingClientMapping = [
    { meetingIndex: 0, clientIndex: 0 }, // Sarah - Meeting 1
    { meetingIndex: 1, clientIndex: 0 }, // Sarah - Meeting 2
    { meetingIndex: 2, clientIndex: 1 }, // Mike - Meeting 1
    { meetingIndex: 3, clientIndex: 4 }, // David - Meeting 1
    { meetingIndex: 4, clientIndex: 6 }  // Alex - Meeting 1
  ];
  
  meetingClientMapping.forEach((mapping) => {
    const meeting = mockData.meetings[mapping.meetingIndex];
    const clientInfo = clientIds.find(c => c.clientIndex === mapping.clientIndex);
    if (!clientInfo) return;
    
    const meetingId = generateUUID();
    sql.push(`INSERT INTO meetings (
      meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, is_discovery,
      transcript, summary, pain_point, goal, suggestion, sales_technique_advice, coaching_advice,
      action_items_client, action_items_coach, mind_map, email_content, resources_list,
      next_meeting_prep, additional_notes, analysis_status, created_at, provider, provider_meeting_id, correlation_id
    ) VALUES (
      '${meetingId}',
      '${clientInfo.userId}',
      '${clientInfo.clientId}',
      '${meeting.client_name}',
      '${meeting.meeting_title}',
      '${meeting.meeting_date}',
      ${meeting.is_discovery},
      ${meeting.transcript ? `'${meeting.transcript.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.summary ? `'${meeting.summary.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.pain_point ? `'${meeting.pain_point.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.goal ? `'${meeting.goal.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.suggestion ? `'${meeting.suggestion.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.sales_technique_advice ? `'${meeting.sales_technique_advice.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.coaching_advice ? `'${meeting.coaching_advice.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.action_items_client ? `'${meeting.action_items_client.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.action_items_coach ? `'${meeting.action_items_coach.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.mind_map ? `'${meeting.mind_map.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.email_content ? `'${meeting.email_content.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.resources_list ? `'${meeting.resources_list.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.next_meeting_prep ? `'${meeting.next_meeting_prep.replace(/'/g, "''")}'` : 'NULL'},
      ${meeting.additional_notes ? `'${meeting.additional_notes.replace(/'/g, "''")}'` : 'NULL'},
      '${meeting.analysis_status}',
      '${randomTimestamp(30)}',
      ${meeting.provider ? `'${meeting.provider}'` : 'NULL'},
      ${meeting.provider_meeting_id ? `'${meeting.provider_meeting_id}'` : 'NULL'},
      ${meeting.correlation_id ? `'${meeting.correlation_id}'` : 'NULL'}
    );`);
    
    // 為部分會議插入 Instagram Posts 和 Reels Ideas
    if (mapping.meetingIndex < mockData.instagram_posts.length) {
      const post = mockData.instagram_posts[mapping.meetingIndex];
      sql.push(`INSERT INTO instagram_posts (post_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at) VALUES (
        '${generateUUID()}',
        '${clientInfo.userId}',
        '${meetingId}',
        ${post.is_favorite},
        ${post.is_published},
        '${post.hook.replace(/'/g, "''")}',
        '${post.content.replace(/'/g, "''")}',
        '${post.tags}',
        '${randomTimestamp(10)}'
      );`);
    }
    
    if (mapping.meetingIndex < mockData.reels_ideas.length) {
      const reel = mockData.reels_ideas[mapping.meetingIndex];
      sql.push(`INSERT INTO reels_ideas (reels_ideas_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at) VALUES (
        '${generateUUID()}',
        '${clientInfo.userId}',
        '${meetingId}',
        ${reel.is_favorite},
        ${reel.is_published},
        '${reel.hook.replace(/'/g, "''")}',
        '${reel.content.replace(/'/g, "''")}',
        '${reel.tags}',
        '${randomTimestamp(10)}'
      );`);
    }
  });
  
  return sql.join('\n');
}

// 輸出 SQL
if (require.main === module) {
  const sql = generateSQL();
  console.log(sql);
  
  // 同時輸出到檔案
  const fs = require('fs');
  fs.writeFileSync('./generate-mock-data.sql', sql);
  console.log('\n-- SQL 已寫入 generate-mock-data.sql');
  console.log('-- 執行方式：wrangler d1 execute coachdb --file=./generate-mock-data.sql');
}

module.exports = { generateSQL, mockData };

