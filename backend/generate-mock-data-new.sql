-- Insert Users
INSERT INTO users (user_id, email, password_hash, plan, verified, onboarding_completed, last_login, clients_columns_settings, created_at) VALUES (
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      'coach1@example.com',
      '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      'pro',
      true,
      true,
      '2025-11-11T06:35:45.081Z',
      '["Client Name","Email","Notes","Tags","Status"]',
      '2025-10-27T15:25:11.031Z'
    );
INSERT INTO users (user_id, email, password_hash, plan, verified, onboarding_completed, last_login, clients_columns_settings, created_at) VALUES (
      '9404433c-f15e-4af6-928f-2fe855a87191',
      'coach2@example.com',
      '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      'basic',
      true,
      true,
      '2025-11-11T03:55:04.121Z',
      '["Client Name","Email","Status"]',
      '2025-09-28T08:15:50.436Z'
    );
INSERT INTO users (user_id, email, password_hash, plan, verified, onboarding_completed, last_login, clients_columns_settings, created_at) VALUES (
      'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
      'coach3@example.com',
      '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      'free',
      true,
      false,
      NULL,
      NULL,
      '2025-11-05T05:07:43.620Z'
    );

-- Insert Tags
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '86ba3294-7110-4150-b4f6-7accc98eb2bd',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        'VIP',
        '#FF6B6B',
        '2025-10-17T00:04:04.348Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '73661896-c38a-4846-a9b8-b070eb345f37',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        'High Priority',
        '#4ECDC4',
        '2025-10-22T19:57:45.342Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '754a6fe2-bd58-492c-b3a0-4a9eb2db36dc',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        'Follow Up',
        '#FFE66D',
        '2025-10-26T01:50:47.396Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        'bccc564b-b554-46a2-a42c-5685d291c96a',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        'New Client',
        '#95E1D3',
        '2025-11-05T19:18:02.829Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '67f8a80e-3431-4926-9942-fd44ff94b6af',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        'Long Term',
        '#AA96DA',
        '2025-10-15T05:36:21.344Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '81ad3d6d-5eb0-4800-bfe9-eb57a9e0998e',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        'Corporate',
        '#FCBAD3',
        '2025-11-09T21:35:46.835Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '30a975e1-3a50-44fb-ade8-6b0568fde94f',
        '9404433c-f15e-4af6-928f-2fe855a87191',
        'VIP',
        '#FF6B6B',
        '2025-11-01T05:24:23.594Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '73f6f1ff-7fb5-4dda-a587-28adcfae6381',
        '9404433c-f15e-4af6-928f-2fe855a87191',
        'High Priority',
        '#4ECDC4',
        '2025-10-22T13:36:52.485Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '0bbcb855-87ed-4698-bfad-bf3a278a274e',
        '9404433c-f15e-4af6-928f-2fe855a87191',
        'Follow Up',
        '#FFE66D',
        '2025-11-06T19:37:57.974Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '8e6811f2-807f-40d5-b2fd-c93f7db17c65',
        '9404433c-f15e-4af6-928f-2fe855a87191',
        'New Client',
        '#95E1D3',
        '2025-10-26T18:40:20.916Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '1cc2deb5-b2c9-4537-a89e-bc3fbcd23d5d',
        '9404433c-f15e-4af6-928f-2fe855a87191',
        'Long Term',
        '#AA96DA',
        '2025-11-07T15:19:03.195Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '926e6602-cc5e-4853-abe5-6eddadab72aa',
        '9404433c-f15e-4af6-928f-2fe855a87191',
        'Corporate',
        '#FCBAD3',
        '2025-10-31T20:32:08.098Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '61c2a94c-2d7d-465b-9e0d-c386d159300c',
        'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
        'VIP',
        '#FF6B6B',
        '2025-10-14T08:37:39.660Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '1eefc343-242c-4d39-9f27-e8c329922b86',
        'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
        'High Priority',
        '#4ECDC4',
        '2025-11-08T06:09:36.291Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        '58dd4d1e-b7bc-42e0-b99a-7fb402ad96f4',
        'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
        'Follow Up',
        '#FFE66D',
        '2025-11-10T03:46:25.504Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        'e3769e7c-1f78-4bbd-9dbe-50ace0ddf3c5',
        'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
        'New Client',
        '#95E1D3',
        '2025-11-10T11:33:30.795Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        'd3ea5544-6a8c-4355-9a06-22c6bf6290a3',
        'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
        'Long Term',
        '#AA96DA',
        '2025-11-07T16:05:21.729Z'
      );
INSERT INTO tags (id, user_id, name, color, created_at) VALUES (
        'cc0b8943-9601-4bd2-a995-515d9c0c55f2',
        'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
        'Corporate',
        '#FCBAD3',
        '2025-11-11T05:08:57.175Z'
      );

-- Insert Clients
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      'e66cea57-6bba-4cc3-98e7-2f5d96f39ca6',
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      'Sarah Johnson',
      'sarah.johnson@techstart.com',
      'Active',
      'Marketing director at TechStart. Focus on team performance and conversion optimization.',
      'Referral',
      'Converted',
      'Executive Coaching',
      'Leadership Development',
      '2025-09-30',
      'Active',
      'Paid',
      '2025-10-30T10:52:54.762Z',
      1
    );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            '1598c308-251b-4244-876a-ffca85ec6abf',
            'e66cea57-6bba-4cc3-98e7-2f5d96f39ca6',
            '86ba3294-7110-4150-b4f6-7accc98eb2bd',
            '2025-11-03T05:52:33.012Z'
          );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            '9213cf37-e902-4bfc-acb2-cb8b66db04b5',
            'e66cea57-6bba-4cc3-98e7-2f5d96f39ca6',
            '73661896-c38a-4846-a9b8-b070eb345f37',
            '2025-10-20T12:58:11.027Z'
          );
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      '14f74c87-c9c1-4549-9cbd-bde8b18b8de8',
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      'Mike Chen',
      'mike.chen@innovate.com',
      'Active',
      'Startup founder. Needs help with customer acquisition and scaling.',
      'Website',
      'Converted',
      'Business Coaching',
      'Growth Strategy',
      '2025-11-01',
      'Active',
      'Paid',
      '2025-09-18T20:45:31.229Z',
      3
    );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            '0801345f-f23c-4321-b20d-6dabb1cfe929',
            '14f74c87-c9c1-4549-9cbd-bde8b18b8de8',
            'bccc564b-b554-46a2-a42c-5685d291c96a',
            '2025-11-09T23:05:32.709Z'
          );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            '7856341e-2ded-4aeb-987a-3b2258dda26b',
            '14f74c87-c9c1-4549-9cbd-bde8b18b8de8',
            '754a6fe2-bd58-492c-b3a0-4a9eb2db36dc',
            '2025-11-11T04:04:13.645Z'
          );
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      '406584d8-d2a9-4852-ae38-03b1297b78f1',
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      'Lisa Rodriguez',
      'lisa.rodriguez@digitalpro.com',
      'Active',
      'Team leader struggling with motivation and performance.',
      'LinkedIn',
      'Converted',
      'Team Leadership',
      'Performance Improvement',
      '2025-11-08',
      'Active',
      'Sent',
      '2025-09-23T13:40:52.200Z',
      3
    );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            'f5a6d5df-51e6-49db-89ea-92eb7eeb58ff',
            '406584d8-d2a9-4852-ae38-03b1297b78f1',
            '67f8a80e-3431-4926-9942-fd44ff94b6af',
            '2025-10-13T15:29:04.923Z'
          );
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      '72f242c6-0c9c-49cb-9543-ceebe7f9029f',
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      'Robert Kim',
      'robert.kim@corp.com',
      'Prospect',
      'Interested in executive coaching. Initial consultation scheduled.',
      'Email Campaign',
      'Qualified',
      'Executive Coaching',
      NULL,
      NULL,
      'Pending',
      'Pending',
      '2025-08-15T14:46:10.808Z',
      6
    );
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      'e4ae1b5f-52b0-4aa6-9cea-9e5c86d4eff5',
      '9404433c-f15e-4af6-928f-2fe855a87191',
      'David Wilson',
      'david.wilson@scaleup.com',
      'Active',
      'Small business owner looking to scale operations.',
      'Referral',
      'Converted',
      'Business Coaching',
      'Scaling Strategy',
      '2025-10-19',
      'Active',
      'Paid',
      '2025-11-02T00:30:44.884Z',
      10
    );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            '7610d037-8496-4cfe-8b98-55bc876cc3a4',
            'e4ae1b5f-52b0-4aa6-9cea-9e5c86d4eff5',
            '926e6602-cc5e-4853-abe5-6eddadab72aa',
            '2025-10-14T22:16:15.143Z'
          );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            'aa1f6103-2fbd-4e48-ba5a-734db89da296',
            'e4ae1b5f-52b0-4aa6-9cea-9e5c86d4eff5',
            '1cc2deb5-b2c9-4537-a89e-bc3fbcd23d5d',
            '2025-10-18T06:01:43.523Z'
          );
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      'f0571756-5143-4f8b-91ec-b0fe7c6335e0',
      '9404433c-f15e-4af6-928f-2fe855a87191',
      'Emma Thompson',
      'emma.thompson@growthco.com',
      'Active',
      'Career transition from corporate to entrepreneurship.',
      'Website',
      'Converted',
      'Career Coaching',
      'Transition Support',
      '2025-10-13',
      'Active',
      'Paid',
      '2025-09-21T15:34:53.639Z',
      2
    );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            '1d2ff79a-1ff9-401f-89f4-6b378b192549',
            'f0571756-5143-4f8b-91ec-b0fe7c6335e0',
            '0bbcb855-87ed-4698-bfad-bf3a278a274e',
            '2025-10-31T09:33:40.511Z'
          );
INSERT INTO clients (client_id, user_id, name, email, status, notes, source, lead_status, engagement_type, program, start_date, contract_status, invoice_status, created_at, session_counts) VALUES (
      'f3396ca0-9a02-4572-80b7-2506876d57b8',
      'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
      'Alex Kim',
      'alex.kim@startup.com',
      'Active',
      'Startup founder seeking funding guidance.',
      'Social Media',
      'Converted',
      'Business Coaching',
      'Funding Strategy',
      '2025-11-11',
      'Active',
      'Pending',
      '2025-08-28T04:20:50.282Z',
      8
    );
INSERT INTO client_tags (id, client_id, tag_id, created_at) VALUES (
            'dad9584c-173b-4bf3-8145-6c1a0a94df75',
            'f3396ca0-9a02-4572-80b7-2506876d57b8',
            'e3769e7c-1f78-4bbd-9dbe-50ace0ddf3c5',
            '2025-10-19T21:38:42.047Z'
          );

-- Insert Meetings
INSERT INTO meetings (
      meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, is_discovery,
      transcript, summary, pain_point, goal, suggestion, sales_technique_advice, coaching_advice,
      action_items_client, action_items_coach, mind_map, email_content, resources_list,
      next_meeting_prep, additional_notes, analysis_status, created_at, provider, provider_meeting_id, correlation_id
    ) VALUES (
      '6bef0dc6-1fc9-4e78-ad08-b4f40d4666d1',
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      'e66cea57-6bba-4cc3-98e7-2f5d96f39ca6',
      'Sarah Johnson',
      'Initial Discovery Call',
      '2025-10-13',
      true,
      'Sarah discussed her team''s performance challenges and low conversion rates. She mentioned lack of analytics tracking and team training as main concerns.',
      'Sarah is a marketing director struggling with team performance and low conversion rates. Main issues are lack of analytics tracking and team training.',
      'Lack of proper analytics tracking and team training on digital marketing tools',
      'Increase conversion rate by 25% this quarter and improve ROI',
      'Implement analytics platform and develop training program',
      'Ask more specific questions about current analytics setup. Provide data-driven examples of successful implementations.',
      'Focus on progress tracking and celebrate small wins. Encourage data-driven decision making.',
      '["Implement analytics platform","Develop training program","Set up conversion tracking"]',
      '["Follow up on implementation","Provide additional resources","Schedule progress review"]',
      '{"nodes":[{"id":"analytics","label":"Analytics Setup"},{"id":"training","label":"Team Training"}]}',
      'Thank you for our discussion today. Here are the key action items...',
      '["Analytics Best Practices Guide","Team Training Resources"]',
      'Review analytics implementation progress. Discuss training program timeline.',
      'Sarah is highly motivated and responsive. Good candidate for long-term engagement.',
      'completed',
      '2025-11-02T11:51:57.461Z',
      'zoom',
      'zoom-25546c4b-d187-48f1-87c4-a206ff80243a',
      '0e29dc97-e599-4764-a8b4-494dd0b22c0e'
    );
INSERT INTO instagram_posts (post_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at) VALUES (
        '5f8ffcbe-c850-40e4-a5bf-ebdd6db80153',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        '6bef0dc6-1fc9-4e78-ad08-b4f40d4666d1',
        true,
        true,
        '5 Secrets to Boost Your Team''s Performance',
        'Want to improve your team''s performance? Here are 5 proven strategies that successful leaders use...',
        '["leadership","team-performance","coaching"]',
        '2025-11-08T08:27:29.701Z'
      );
INSERT INTO reels_ideas (reels_ideas_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at) VALUES (
        '1c5dcf61-db56-4323-ab83-d4ddfdfa856c',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        '6bef0dc6-1fc9-4e78-ad08-b4f40d4666d1',
        true,
        false,
        '3 Mistakes That Kill Your Conversion Rate',
        'Are you making these common mistakes? Here''s how to fix them and boost your conversion rate...',
        '["marketing","conversion","tips"]',
        '2025-11-09T05:47:57.661Z'
      );
INSERT INTO meetings (
      meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, is_discovery,
      transcript, summary, pain_point, goal, suggestion, sales_technique_advice, coaching_advice,
      action_items_client, action_items_coach, mind_map, email_content, resources_list,
      next_meeting_prep, additional_notes, analysis_status, created_at, provider, provider_meeting_id, correlation_id
    ) VALUES (
      '11ec353f-4459-462f-83ad-a6be1265ffe5',
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      'e66cea57-6bba-4cc3-98e7-2f5d96f39ca6',
      'Sarah Johnson',
      'Progress Review Session',
      '2025-10-16',
      false,
      'Sarah has implemented basic analytics but needs help with advanced tracking. Team training is progressing well.',
      'Sarah has implemented basic analytics but needs help with advanced tracking. Team training is progressing well.',
      'Advanced analytics implementation and campaign optimization',
      'Optimize campaigns using data insights',
      'Implement advanced tracking and optimize campaigns based on data',
      'Provide specific examples of advanced tracking. Ask about data insights.',
      'Celebrate progress made. Focus on next steps for optimization.',
      '["Implement advanced tracking","Optimize campaigns","Review performance metrics"]',
      '["Provide optimization resources","Schedule follow-up","Monitor progress"]',
      NULL,
      'Great progress on analytics implementation! Let''s focus on advanced tracking...',
      '["Advanced Analytics Guide","Campaign Optimization Tips"]',
      'Review advanced tracking implementation. Discuss campaign optimization results.',
      'Conversion rates improved by 15%. On track to reach 25% goal.',
      'completed',
      '2025-10-23T23:05:58.994Z',
      'google',
      'google-105f03c8-d2e5-4125-a771-32928870a8c8',
      '96fe30cd-1ccc-4691-a5b0-866f48cd6685'
    );
INSERT INTO instagram_posts (post_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at) VALUES (
        'fd932203-9d5c-424e-a0fb-a0d315c6a5a0',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        '11ec353f-4459-462f-83ad-a6be1265ffe5',
        false,
        false,
        'How to Scale Your Business Without Losing Quality',
        'Scaling your business is exciting, but maintaining quality can be challenging. Here''s how...',
        '["business-growth","scaling","entrepreneurship"]',
        '2025-11-02T07:46:36.679Z'
      );
INSERT INTO reels_ideas (reels_ideas_id, user_id, meeting_id, is_favorite, is_published, hook, content, tags, created_at) VALUES (
        'ececc648-fb09-47b4-a528-d22e25de96a8',
        'b20b96f8-c1d5-4259-a520-27bcd8844165',
        '11ec353f-4459-462f-83ad-a6be1265ffe5',
        false,
        true,
        'From Corporate to Entrepreneur: My Journey',
        'Thinking about making the leap? Here''s what I learned from my transition...',
        '["career","entrepreneurship","motivation"]',
        '2025-11-11T11:15:46.589Z'
      );
INSERT INTO meetings (
      meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, is_discovery,
      transcript, summary, pain_point, goal, suggestion, sales_technique_advice, coaching_advice,
      action_items_client, action_items_coach, mind_map, email_content, resources_list,
      next_meeting_prep, additional_notes, analysis_status, created_at, provider, provider_meeting_id, correlation_id
    ) VALUES (
      'e449ed91-6082-445a-9b19-9cd2f63ec614',
      'b20b96f8-c1d5-4259-a520-27bcd8844165',
      '14f74c87-c9c1-4549-9cbd-bde8b18b8de8',
      'Mike Chen',
      'Sales Strategy Discovery',
      '2025-10-04',
      true,
      'Mike discussed his startup''s customer acquisition challenges. Has great product but marketing strategy needs improvement.',
      'Mike is a startup founder struggling with customer acquisition. Has great product but marketing strategy needs improvement.',
      'Struggling to scale business with limited customer acquisition',
      'Increase customer acquisition by 50% in the next quarter',
      'Develop comprehensive marketing strategy and customer acquisition plan',
      'Ask about current strategy. Explore pain points in detail.',
      'Build trust and understand business model. Assess readiness for growth.',
      '["Develop marketing strategy","Create customer acquisition plan","Identify target audience"]',
      '["Research industry best practices","Prepare strategy framework","Schedule strategy session"]',
      NULL,
      'Thank you for sharing your challenges. Let''s develop a comprehensive strategy...',
      '["Marketing Strategy Template","Customer Acquisition Guide"]',
      'Review marketing strategy draft. Discuss customer acquisition tactics.',
      'Mike is tech-savvy but needs marketing guidance. Good potential for growth.',
      'completed',
      '2025-10-17T12:37:02.643Z',
      'zoom',
      'zoom-15be308a-907b-44d1-829f-08e3cefb3e77',
      '3e7d4b33-772c-4966-a42e-e5ebe25c8795'
    );
INSERT INTO meetings (
      meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, is_discovery,
      transcript, summary, pain_point, goal, suggestion, sales_technique_advice, coaching_advice,
      action_items_client, action_items_coach, mind_map, email_content, resources_list,
      next_meeting_prep, additional_notes, analysis_status, created_at, provider, provider_meeting_id, correlation_id
    ) VALUES (
      '05f94b06-e8a8-498e-ad71-302bc1263d4a',
      '9404433c-f15e-4af6-928f-2fe855a87191',
      'e4ae1b5f-52b0-4aa6-9cea-9e5c86d4eff5',
      'David Wilson',
      'Business Scaling Discovery',
      '2025-10-13',
      true,
      'David discussed scaling challenges for his small business. Needs help with operational efficiency.',
      'David runs a successful small business but struggles with scaling. Needs help with operational efficiency.',
      'Operational inefficiencies and scaling challenges',
      'Scale business operations and improve efficiency',
      'Implement operational improvements and scaling strategies',
      'Understand business model. Explore scaling barriers.',
      'Assess current operations. Identify improvement areas.',
      '["Audit current operations","Develop scaling plan","Identify bottlenecks"]',
      '["Research scaling strategies","Prepare operational framework","Schedule review"]',
      NULL,
      'Thank you for our discussion. Let''s focus on operational improvements...',
      '["Scaling Guide","Operational Efficiency Checklist"]',
      'Review operational audit results. Discuss scaling strategy.',
      'David has strong foundation but needs systematic approach to scaling.',
      'completed',
      '2025-10-20T14:26:07.923Z',
      'google',
      'google-3340e670-8625-466d-867f-73b4893c296e',
      '050eb46c-51b9-477f-8608-82c50f917225'
    );
INSERT INTO meetings (
      meeting_id, user_id, client_id, client_name, meeting_title, meeting_date, is_discovery,
      transcript, summary, pain_point, goal, suggestion, sales_technique_advice, coaching_advice,
      action_items_client, action_items_coach, mind_map, email_content, resources_list,
      next_meeting_prep, additional_notes, analysis_status, created_at, provider, provider_meeting_id, correlation_id
    ) VALUES (
      '3a989f32-9991-4e4a-9967-2edad344a2d5',
      'b9b3df61-e767-4a97-ae31-4b3bab6c85e8',
      'f3396ca0-9a02-4572-80b7-2506876d57b8',
      'Alex Kim',
      'Startup Funding Discovery',
      '2025-11-07',
      true,
      'Alex discussed funding needs for his startup. Needs help with pitch preparation.',
      'Alex is a startup founder seeking funding. Needs help with pitch preparation and investor relations.',
      'Lack of funding and investor connections',
      'Secure startup funding and build investor relationships',
      'Develop pitch deck and investor outreach strategy',
      'Understand business model. Explore funding needs.',
      'Assess pitch readiness. Build confidence.',
      '["Develop pitch deck","Create investor list","Practice pitch"]',
      '["Provide pitch resources","Schedule pitch practice","Review pitch deck"]',
      NULL,
      'Thank you for sharing your funding goals. Let''s work on your pitch...',
      NULL,
      'Review pitch deck draft. Practice pitch delivery.',
      'Alex is enthusiastic but needs guidance on investor relations.',
      'pending',
      '2025-10-24T04:50:24.429Z',
      NULL,
      NULL,
      NULL
    );

-- SQL 已寫入 generate-mock-data.sql
-- 執行方式：wrangler d1 execute coachdb --file=./generate-mock-data.sql
