require('dotenv').config();
const mongoose = require('mongoose');
const { Community } = require('./models/Community');
const OfficialGroupPost = require('./models/OfficialGroupPost');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    // Remove existing official groups and posts
    await Community.deleteMany({ isOfficial: true });
    await OfficialGroupPost.deleteMany({});

    // Create official groups
    const groups = await Community.insertMany([
        { name: 'ABLE Official Updates', description: 'Platform announcements, feature updates, and important news from the ABLE team.', type: 'support-circle', groupType: 'official_group', createdByType: 'admin', postingPermission: 'admin_only', joinPolicy: 'open', commentingEnabled: true, reactionsEnabled: true, isOfficial: true, isFeatured: true, category: 'Announcements', rules: 'Be respectful. No spam. Report inappropriate content.', status: 'approved' },
        { name: 'Mental Wellness Learning Circle', description: 'Evidence-based mental wellness guides, tips, and educational content from our professionals.', type: 'support-circle', groupType: 'official_group', createdByType: 'admin', postingPermission: 'admin_and_professionals', joinPolicy: 'open', commentingEnabled: true, reactionsEnabled: true, isOfficial: true, isFeatured: true, category: 'Learning', rules: 'Educational content only. No personal diagnoses. Be supportive.', status: 'approved' },
        { name: 'Youth Growth Announcements', description: 'Updates, challenges, and resources specifically for our 13-24 age community.', type: 'support-circle', groupType: 'official_group', createdByType: 'admin', postingPermission: 'admin_only', joinPolicy: 'open', commentingEnabled: true, reactionsEnabled: true, isOfficial: true, isFeatured: false, category: 'Youth', rules: 'Youth-friendly content. Be encouraging. No bullying.', status: 'approved' },
        { name: 'Professional Guidance Room', description: 'Licensed professionals share wellness insights, coping strategies, and evidence-based advice.', type: 'support-circle', groupType: 'professional_group', createdByType: 'admin', postingPermission: 'admin_and_professionals', joinPolicy: 'open', commentingEnabled: true, reactionsEnabled: true, isOfficial: true, isFeatured: true, category: 'Professional', rules: 'Only educational/supportive content. No diagnosis. Include sources where possible.', status: 'approved' },
        { name: 'Weekly Wellness Challenges', description: 'Join our weekly challenges designed to build healthy habits and track your progress.', type: 'support-circle', groupType: 'official_group', createdByType: 'admin', postingPermission: 'admin_only', joinPolicy: 'open', commentingEnabled: true, reactionsEnabled: true, isOfficial: true, isFeatured: false, category: 'Challenges', rules: 'Participate at your own pace. Share your progress if comfortable.', status: 'approved' }
    ]);
    console.log(`✅ ${groups.length} official groups created`);

    // Create sample posts
    const posts = await OfficialGroupPost.insertMany([
        { groupId: groups[0]._id, authorType: 'admin', title: 'Welcome to ABLE Community!', content: 'We are excited to launch our official community groups. Here you will find announcements, updates, and important information about the ABLE platform.\n\nStay tuned for weekly updates and new feature launches!', summary: 'Introduction to ABLE official community groups', contentType: 'announcement', isPinned: true, status: 'published' },
        { groupId: groups[0]._id, authorType: 'admin', title: 'New Feature: Self-Care Check-In', content: 'We have launched a new daily self-care check-in feature! Track your mood, energy, and receive personalized recommendations.\n\nTry it now at the Self-Care page.', summary: 'Daily check-in feature announcement', contentType: 'announcement', status: 'published' },
        { groupId: groups[1]._id, authorType: 'admin', title: '5 Simple Grounding Techniques for Anxiety', content: 'When anxiety strikes, grounding techniques can help bring you back to the present moment. Here are 5 evidence-based methods:\n\n1. 5-4-3-2-1 Sensory Exercise: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.\n\n2. Box Breathing: Inhale 4 counts, hold 4, exhale 4, hold 4.\n\n3. Cold Water: Splash cold water on your face or hold ice cubes.\n\n4. Progressive Muscle Relaxation: Tense and release each muscle group.\n\n5. Mindful Walking: Focus on each step and the sensation of your feet.', summary: 'Evidence-based grounding techniques for managing anxiety', contentType: 'guide', sourceRefs: ['NIMH Anxiety Resources', 'WHO Mental Health Guidelines'], status: 'published' },
        { groupId: groups[1]._id, authorType: 'admin', title: 'Understanding the Gut-Brain Connection', content: 'Recent research shows a strong link between gut health and mental wellness. The gut produces approximately 95% of your body\'s serotonin.\n\nKey takeaways:\n- Probiotic foods can support mood regulation\n- Fiber-rich diets support gut bacteria diversity\n- Stress can negatively impact gut health\n- A balanced diet supports both physical and mental wellness\n\nThis is not medical advice. Consult a professional for personalized guidance.', summary: 'How gut health affects mental wellness', contentType: 'learning', sourceRefs: ['Harvard Health Publishing', 'American Psychological Association'], status: 'published' },
        { groupId: groups[3]._id, authorType: 'admin', title: 'How to Support Someone Who is Overwhelmed', content: 'When someone you care about is overwhelmed, here are supportive approaches:\n\n1. Listen without fixing: Sometimes people need to be heard, not solved.\n2. Validate their feelings: "That sounds really hard" goes a long way.\n3. Offer specific help: "Can I bring dinner?" is better than "Let me know if you need anything."\n4. Check in later: Following up shows you remember and care.\n5. Respect boundaries: If they need space, give it without taking it personally.\n\nRemember: You don\'t need to be a therapist to be supportive.', summary: 'Practical ways to support overwhelmed loved ones', contentType: 'guide', sourceRefs: ['UNICEF Mental Health Communication', 'NIMH Support Resources'], status: 'published' },
        { groupId: groups[4]._id, authorType: 'admin', title: 'This Week: 7-Day Gratitude Challenge', content: 'This week\'s challenge: Write down 3 things you are grateful for each day.\n\nDay 1: Something about your body\nDay 2: A person in your life\nDay 3: Something you learned recently\nDay 4: A small comfort\nDay 5: Something in nature\nDay 6: An ability or skill\nDay 7: Reflect on the week\n\nShare your reflections in the comments below!', summary: 'Weekly gratitude journaling challenge', contentType: 'challenge', isPinned: true, status: 'published' }
    ]);
    console.log(`✅ ${posts.length} official posts created`);

    console.log('\n🎉 Official Groups seeded successfully!');
    process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
