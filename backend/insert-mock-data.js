const insertMockData = async () => {
  try {
    // Mock data for different users
    const mockUsers = [
      { userId: 'user-001', email: 'coach1@example.com', plan: 'premium' },
      { userId: 'user-002', email: 'coach2@example.com', plan: 'premium' },
      { userId: 'user-003', email: 'coach3@example.com', plan: 'free' }
    ];

    // Mock clients for each user
    const mockClients = [
      // User 1 clients
      { userId: 'user-001', name: 'Sarah Johnson', email: 'sarah@techstart.com', phoneNumber: '+1234567890' },
      { userId: 'user-001', name: 'Mike Chen', email: 'mike@innovate.com', phoneNumber: '+1234567891' },
      { userId: 'user-001', name: 'Lisa Rodriguez', email: 'lisa@digitalpro.com', phoneNumber: '+1234567892' },
      
      // User 2 clients
      { userId: 'user-002', name: 'David Wilson', email: 'david@scaleup.com', phoneNumber: '+1234567893' },
      { userId: 'user-002', name: 'Emma Thompson', email: 'emma@growthco.com', phoneNumber: '+1234567894' },
      
      // User 3 clients
      { userId: 'user-003', name: 'Alex Kim', email: 'alex@startup.com', phoneNumber: '+1234567895' }
    ];

    // Mock meetings data
    const mockMeetings = [
      // Sarah Johnson meetings (User 1)
      {
        userId: 'user-001',
        clientName: 'Sarah Johnson',
        meetingTitle: 'Initial Discovery Call',
        meetingDate: '2024-01-15',
        isDiscovery: true,
        summary: 'Sarah is a marketing director struggling with team performance and low conversion rates. Main issues are lack of analytics tracking and team training.',
        painPoint: 'Lack of proper analytics tracking and team training on digital marketing tools',
        goal: 'Increase conversion rate by 25% this quarter and improve ROI',
        suggestion: 'Implement analytics platform and develop training program',
        salesTechniqueAdvice: JSON.stringify(['Ask more specific questions', 'Provide data-driven examples']),
        coachingAdvice: JSON.stringify(['Focus on progress tracking', 'Encourage data-driven decisions']),
        actionItemsClient: JSON.stringify(['Implement analytics platform', 'Develop training program']),
        actionItemsCoach: JSON.stringify(['Follow up on implementation', 'Provide additional resources'])
      },
      {
        userId: 'user-001',
        clientName: 'Sarah Johnson',
        meetingTitle: 'Progress Review Session',
        meetingDate: '2024-02-01',
        isDiscovery: false,
        summary: 'Sarah has implemented basic analytics but needs help with advanced tracking. Team training is progressing well.',
        painPoint: 'Advanced analytics implementation and campaign optimization',
        goal: 'Optimize campaigns using data insights',
        suggestion: 'Implement advanced tracking and optimize campaigns based on data',
        salesTechniqueAdvice: JSON.stringify(['Provide specific examples', 'Ask about data insights']),
        coachingAdvice: JSON.stringify(['Celebrate progress', 'Focus on next steps']),
        actionItemsClient: JSON.stringify(['Implement advanced tracking', 'Optimize campaigns']),
        actionItemsCoach: JSON.stringify(['Provide optimization resources', 'Schedule follow-up'])
      },
      {
        userId: 'user-001',
        clientName: 'Sarah Johnson',
        meetingTitle: 'Strategy Deep Dive',
        meetingDate: '2024-02-15',
        isDiscovery: false,
        summary: 'Sarah has made significant progress with analytics. Conversion rates improved by 15%. Now focusing on scaling successful strategies.',
        painPoint: 'Scaling successful strategies and maintaining momentum',
        goal: 'Scale successful strategies and reach 25% conversion increase',
        suggestion: 'Scale successful campaigns and implement automation',
        salesTechniqueAdvice: JSON.stringify(['Celebrate achievements', 'Focus on scaling']),
        coachingAdvice: JSON.stringify(['Encourage confidence', 'Support scaling efforts']),
        actionItemsClient: JSON.stringify(['Scale successful campaigns', 'Implement automation']),
        actionItemsCoach: JSON.stringify(['Provide scaling resources', 'Monitor progress'])
      },

      // Mike Chen meetings (User 1)
      {
        userId: 'user-001',
        clientName: 'Mike Chen',
        meetingTitle: 'Sales Strategy Discovery',
        meetingDate: '2024-01-20',
        isDiscovery: true,
        summary: 'Mike is a startup founder struggling with customer acquisition. Has great product but marketing strategy needs improvement.',
        painPoint: 'Struggling to scale business with limited customer acquisition',
        goal: 'Increase customer acquisition by 50% in the next quarter',
        suggestion: 'Develop comprehensive marketing strategy and customer acquisition plan',
        salesTechniqueAdvice: JSON.stringify(['Ask about current strategy', 'Explore pain points']),
        coachingAdvice: JSON.stringify(['Build trust', 'Understand business model']),
        actionItemsClient: JSON.stringify(['Develop marketing strategy', 'Create customer acquisition plan']),
        actionItemsCoach: JSON.stringify(['Research industry best practices', 'Prepare strategy framework'])
      },
      {
        userId: 'user-001',
        clientName: 'Mike Chen',
        meetingTitle: 'Marketing Strategy Implementation',
        meetingDate: '2024-02-10',
        isDiscovery: false,
        summary: 'Mike has started implementing new marketing strategies. Early results are promising but needs guidance on optimization.',
        painPoint: 'Optimizing marketing campaigns and measuring effectiveness',
        goal: 'Optimize campaigns and improve conversion rates',
        suggestion: 'Implement tracking and optimize based on performance data',
        salesTechniqueAdvice: JSON.stringify(['Ask about results', 'Provide optimization tips']),
        coachingAdvice: JSON.stringify(['Support implementation', 'Encourage experimentation']),
        actionItemsClient: JSON.stringify(['Implement tracking', 'Optimize campaigns']),
        actionItemsCoach: JSON.stringify(['Provide optimization tools', 'Schedule review'])
      },

      // Lisa Rodriguez meetings (User 1)
      {
        userId: 'user-001',
        clientName: 'Lisa Rodriguez',
        meetingTitle: 'Team Leadership Discovery',
        meetingDate: '2024-01-25',
        isDiscovery: true,
        summary: 'Lisa is a team leader struggling with team motivation and performance. Needs help with leadership skills.',
        painPoint: 'Team motivation and performance issues',
        goal: 'Improve team performance and leadership skills',
        suggestion: 'Develop leadership skills and team motivation strategies',
        salesTechniqueAdvice: JSON.stringify(['Understand team dynamics', 'Explore leadership style']),
        coachingAdvice: JSON.stringify(['Build rapport', 'Assess leadership needs']),
        actionItemsClient: JSON.stringify(['Develop leadership skills', 'Create team motivation plan']),
        actionItemsCoach: JSON.stringify(['Provide leadership resources', 'Schedule follow-up'])
      },

      // David Wilson meetings (User 2)
      {
        userId: 'user-002',
        clientName: 'David Wilson',
        meetingTitle: 'Business Scaling Discovery',
        meetingDate: '2024-01-10',
        isDiscovery: true,
        summary: 'David runs a successful small business but struggles with scaling. Needs help with operational efficiency.',
        painPoint: 'Operational inefficiencies and scaling challenges',
        goal: 'Scale business operations and improve efficiency',
        suggestion: 'Implement operational improvements and scaling strategies',
        salesTechniqueAdvice: JSON.stringify(['Understand business model', 'Explore scaling barriers']),
        coachingAdvice: JSON.stringify(['Assess current operations', 'Identify improvement areas']),
        actionItemsClient: JSON.stringify(['Audit current operations', 'Develop scaling plan']),
        actionItemsCoach: JSON.stringify(['Research scaling strategies', 'Prepare operational framework'])
      },
      {
        userId: 'user-002',
        clientName: 'David Wilson',
        meetingTitle: 'Operational Efficiency Review',
        meetingDate: '2024-02-05',
        isDiscovery: false,
        summary: 'David has implemented some operational improvements. Efficiency has improved by 20%. Now focusing on scaling.',
        painPoint: 'Scaling operations while maintaining quality',
        goal: 'Scale operations and maintain quality standards',
        suggestion: 'Develop scaling strategy and quality control measures',
        salesTechniqueAdvice: JSON.stringify(['Celebrate improvements', 'Focus on scaling']),
        coachingAdvice: JSON.stringify(['Support scaling efforts', 'Maintain quality focus']),
        actionItemsClient: JSON.stringify(['Develop scaling strategy', 'Implement quality controls']),
        actionItemsCoach: JSON.stringify(['Provide scaling resources', 'Monitor quality metrics'])
      },

      // Emma Thompson meetings (User 2)
      {
        userId: 'user-002',
        clientName: 'Emma Thompson',
        meetingTitle: 'Career Transition Discovery',
        meetingDate: '2024-01-30',
        isDiscovery: true,
        summary: 'Emma wants to transition from corporate to entrepreneurship. Needs guidance on business planning.',
        painPoint: 'Uncertainty about entrepreneurship and business planning',
        goal: 'Successfully transition to entrepreneurship',
        suggestion: 'Develop business plan and transition strategy',
        salesTechniqueAdvice: JSON.stringify(['Understand career goals', 'Explore entrepreneurial interests']),
        coachingAdvice: JSON.stringify(['Build confidence', 'Assess readiness']),
        actionItemsClient: JSON.stringify(['Develop business plan', 'Create transition timeline']),
        actionItemsCoach: JSON.stringify(['Provide entrepreneurship resources', 'Schedule planning sessions'])
      },

      // Alex Kim meetings (User 3)
      {
        userId: 'user-003',
        clientName: 'Alex Kim',
        meetingTitle: 'Startup Funding Discovery',
        meetingDate: '2024-01-05',
        isDiscovery: true,
        summary: 'Alex is a startup founder seeking funding. Needs help with pitch preparation and investor relations.',
        painPoint: 'Lack of funding and investor connections',
        goal: 'Secure startup funding and build investor relationships',
        suggestion: 'Develop pitch deck and investor outreach strategy',
        salesTechniqueAdvice: JSON.stringify(['Understand business model', 'Explore funding needs']),
        coachingAdvice: JSON.stringify(['Assess pitch readiness', 'Build confidence']),
        actionItemsClient: JSON.stringify(['Develop pitch deck', 'Create investor list']),
        actionItemsCoach: JSON.stringify(['Provide pitch resources', 'Schedule pitch practice'])
      },
      {
        userId: 'user-003',
        clientName: 'Alex Kim',
        meetingTitle: 'Pitch Preparation Session',
        meetingDate: '2024-02-01',
        isDiscovery: false,
        summary: 'Alex has developed initial pitch materials. Needs refinement and practice for investor meetings.',
        painPoint: 'Pitch refinement and investor meeting preparation',
        goal: 'Refine pitch and prepare for investor meetings',
        suggestion: 'Practice pitch delivery and refine messaging',
        salesTechniqueAdvice: JSON.stringify(['Practice pitch delivery', 'Refine messaging']),
        coachingAdvice: JSON.stringify(['Build confidence', 'Provide feedback']),
        actionItemsClient: JSON.stringify(['Practice pitch delivery', 'Refine messaging']),
        actionItemsCoach: JSON.stringify(['Provide pitch feedback', 'Schedule practice sessions'])
      }
    ];

    console.log('Starting mock data insertion...');

    // Insert users
    for (const user of mockUsers) {
      const response = await fetch('http://localhost:8787/api/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insertUser',
          data: user
        })
      });
      console.log(`Inserted user: ${user.userId}`);
    }

    // Insert clients and meetings
    for (const meeting of mockMeetings) {
      const response = await fetch('http://localhost:8787/api/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insertMeeting',
          data: meeting
        })
      });
      console.log(`Inserted meeting: ${meeting.meetingTitle} for ${meeting.clientName}`);
    }

    console.log('Mock data insertion completed successfully!');
    console.log('\nSummary:');
    console.log('- 3 users created');
    console.log('- 6 clients created');
    console.log('- 10 meetings created');
    console.log('\nTest the next meeting prep with:');
    console.log('User 1 - Sarah Johnson (3 meetings)');
    console.log('User 1 - Mike Chen (2 meetings)');
    console.log('User 2 - David Wilson (2 meetings)');

  } catch (error) {
    console.error('Error inserting mock data:', error);
  }
};

insertMockData(); 