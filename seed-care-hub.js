require('dotenv').config();
const mongoose = require('mongoose');
const { SelfCarePage } = require('./models/SelfCare');
const { ChildSupportPage } = require('./models/ChildSupport');
const { ParentingPage } = require('./models/Parenting');

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // ===== SELF-CARE PAGE =====
    await SelfCarePage.findOneAndUpdate({ key: 'singleton' }, {
        key: 'singleton',
        hero: {
            title: 'Your Self-Care Space',
            subtitle: 'Small steps to feel calmer, clearer, and more supported.',
            primaryCta: "Start Today's Check-In",
            secondaryCta: 'Explore Self-Care Tools'
        },
        categories: [
            { title: 'Calm Your Mind', description: 'Breathing & grounding techniques to reduce stress', icon: '🧘', moodTags: ['stressed','overwhelmed','angry'], timeRequired: 3, contentType: 'breathing', steps: ['Find a quiet spot', 'Breathe in for 4 counts', 'Hold for 4 counts', 'Exhale for 6 counts', 'Repeat 5 times'], displayOrder: 1 },
            { title: 'Sleep Better', description: 'Wind-down routines for restful sleep', icon: '😴', moodTags: ['tired','stressed'], timeRequired: 10, contentType: 'sleep', steps: ['Dim lights 30 min before bed', 'Put phone away', 'Try 4-7-8 breathing', 'Progressive muscle relaxation', 'Gratitude thought'], displayOrder: 2 },
            { title: 'Build Confidence', description: 'Small daily wins to strengthen self-belief', icon: '💪', moodTags: ['sad','okay'], timeRequired: 5, contentType: 'journaling', steps: ['Write one thing you did well today', 'Name one strength you have', 'Set one tiny goal for tomorrow'], displayOrder: 3 },
            { title: 'Emotional Reset', description: 'Quick tools when feelings are intense', icon: '🌊', moodTags: ['angry','overwhelmed','sad'], timeRequired: 2, contentType: 'grounding', steps: ['Name 5 things you see', 'Name 4 things you can touch', 'Name 3 things you hear', 'Name 2 things you smell', 'Name 1 thing you taste'], displayOrder: 4 },
            { title: 'Healthy Routine', description: 'Build structure that supports your mood', icon: '📅', moodTags: ['tired','okay','great'], timeRequired: 10, contentType: 'routine', steps: ['Set a consistent wake time', 'Plan one nourishing meal', 'Schedule 10 min movement', 'Plan one connection moment', 'Set a wind-down time'], displayOrder: 5 },
            { title: 'Journaling', description: 'Express thoughts and find clarity through writing', icon: '✍️', moodTags: ['sad','stressed','okay'], timeRequired: 5, contentType: 'journaling', steps: ['Write how you feel right now (no filter)', 'What is one thing weighing on you?', 'What is one thing you need today?', 'Write one kind thought to yourself'], displayOrder: 6 },
            { title: 'Breathing', description: 'Quick breathing exercises for instant calm', icon: '🫁', moodTags: ['stressed','angry','overwhelmed'], timeRequired: 2, contentType: 'breathing', steps: ['Box breathing: 4 in, 4 hold, 4 out, 4 hold', 'Repeat 4-6 cycles', 'Notice how your body feels after'], displayOrder: 7 },
            { title: 'Movement', description: 'Gentle movement to shift your energy', icon: '🚶', moodTags: ['tired','sad','okay','great'], timeRequired: 10, contentType: 'movement', steps: ['Stand up and stretch arms overhead', 'Roll shoulders 5 times', 'Walk for 5-10 minutes', 'Shake out hands and feet', 'Take 3 deep breaths'], displayOrder: 8 },
            { title: 'Digital Detox', description: 'Take a break from screens for mental clarity', icon: '📵', moodTags: ['stressed','overwhelmed','tired'], timeRequired: 20, contentType: 'routine', steps: ['Put phone in another room', 'Set a timer for 20 minutes', 'Do something with your hands', 'Notice how you feel without notifications', 'Reflect on what felt different'], displayOrder: 9 }
        ],
        emergencyCard: {
            title: 'Need urgent help?',
            description: 'If you feel unsafe or may hurt yourself or someone else, please contact emergency support or a trusted person immediately.',
            buttonText: 'Get Crisis Support'
        }
    }, { upsert: true });
    console.log('✅ Self-Care page seeded');

    // ===== CHILD SUPPORT PAGE =====
    await ChildSupportPage.findOneAndUpdate({ key: 'singleton' }, {
        key: 'singleton',
        hero: {
            title: 'Child Support Guide',
            subtitle: 'Gentle tools to understand, support, and guide your child.',
            primaryCta: 'Choose Child Age Group'
        },
        ageGroups: [
            { label: '0–5 years', range: '0-5', description: 'Early childhood — building trust, emotional safety, and routines' },
            { label: '6–12 years', range: '6-12', description: 'Middle childhood — friendships, school stress, confidence building' },
            { label: '13–17 years', range: '13-17', description: 'Adolescence — identity, peer pressure, independence, emotional regulation' },
            { label: '18–24 years', range: '18-24', description: 'Young adulthood — career stress, relationships, mental health awareness' }
        ],
        concerns: [
            { title: 'Anger / Tantrums', slug: 'anger', ageGroups: ['0-5','6-12','13-17'], signs: ['Frequent outbursts over small things','Hitting, kicking, or throwing objects','Refusing to calm down','Hostile or defiant behavior'], whatToDo: ['Stay calm yourself — children mirror your energy','Acknowledge the feeling: "I can see you are very upset"','Wait for calm before talking about behavior','Offer choices: "Do you want space, or do you want a hug?"'], whatToAvoid: ['Shouting back or threatening','Comparing to siblings','Punishing emotions (only address unsafe actions)','Ignoring repeated patterns without support'], conversationStarters: ['I can see something made you really angry. Do you want to tell me?','It is okay to feel angry. It is not okay to hurt someone. Let us figure out what to do with this feeling.'], whenToSeekHelp: ['Outbursts are daily and intense','Child talks about hurting self/others','Aggression is escalating over weeks','You feel unsafe'], activities: ['Draw the feeling','Squeeze ice cubes for 30 seconds','Punch a pillow safely','Count backwards from 10 together'], displayOrder: 1 },
            { title: 'Sadness', slug: 'sadness', ageGroups: ['0-5','6-12','13-17','18-24'], signs: ['Withdrawal from friends or family','Loss of interest in activities','Crying more than usual','Changes in sleep or eating'], whatToDo: ['Sit with them without pressure to talk','Say: "I am here. You do not have to explain right now."','Maintain gentle routines','Offer small connection moments'], whatToAvoid: ['Saying "just cheer up" or "others have it worse"','Forcing social interaction','Ignoring signs for more than 2 weeks','Making them feel guilty about their sadness'], conversationStarters: ['I have noticed you seem quieter lately. Is something on your mind?','You do not have to be okay all the time. I am here either way.'], whenToSeekHelp: ['Sadness persists more than 2 weeks','Child mentions wanting to disappear or not exist','Major changes in school performance','Isolation is increasing'], activities: ['Listen to calming music together','Short walk outside','Create something simple (draw, build)','Write a letter to their feelings'], displayOrder: 2 },
            { title: 'School Stress', slug: 'school-stress', ageGroups: ['6-12','13-17','18-24'], signs: ['Avoiding school or homework','Low motivation','Irritability around school topics','Physical complaints (headaches, stomachaches)'], whatToDo: ['Ask one calm question without judgment','Separate homework from quality time','Help break tasks into tiny pieces','Acknowledge effort, not just results'], whatToAvoid: ['Comparing with other children','Adding academic pressure on top of stress','Punishing grades without understanding cause','Making school the only topic of conversation'], conversationStarters: ['I am not here to scold you. I want to understand what feels heavy.','What part feels hardest right now?'], whenToSeekHelp: ['Distress is intense and long-lasting','Affecting family life and friendships','Refusing school for weeks','Expressing hopelessness about future'], activities: ['10-minute homework then break','Create a visual study plan together','Celebrate small completions','Plan one fun thing after school'], displayOrder: 3 },
            { title: 'Bullying', slug: 'bullying', ageGroups: ['6-12','13-17'], signs: ['Not wanting to go to school','Coming home upset or withdrawn','Unexplained injuries or damaged items','Changes in eating, sleeping, or mood'], whatToDo: ['Listen fully before reacting','Reassure: "This is not your fault"','Document what is happening','Contact school together (with child consent if teen)'], whatToAvoid: ['Telling them to just ignore it','Confronting the bully directly','Blaming the child','Minimizing their experience'], conversationStarters: ['Are the kids at school being kind to you?','If someone was making you feel bad, I would want to know so I can help.'], whenToSeekHelp: ['Physical harm is involved','Child refuses to attend school','Self-esteem is deeply affected','Signs of self-harm or suicidal thoughts'], activities: ['Practice assertive responses together','Identify one trusted adult at school','Build confidence outside school','Create a safety plan'], displayOrder: 4 },
            { title: 'Fear / Anxiety', slug: 'anxiety', ageGroups: ['0-5','6-12','13-17','18-24'], signs: ['Excessive worry about everyday things','Avoidance of new situations','Physical symptoms (fast heart, sweating)','Difficulty sleeping alone'], whatToDo: ['Validate the fear: "It makes sense you feel scared"','Teach one simple coping tool (breathing, counting)','Gradually face fears in small steps','Stay calm and confident yourself'], whatToAvoid: ['Saying "there is nothing to be scared of"','Forcing them into feared situations suddenly','Accommodating all avoidance long-term','Making anxiety shameful'], conversationStarters: ['What does the worry feel like in your body?','If the worry had a name, what would it be?'], whenToSeekHelp: ['Anxiety prevents normal daily life','Panic attacks are occurring','Avoidance is expanding to more areas','Child cannot sleep or eat properly'], activities: ['Worry box: write worry, put it away','Body scan: where do you feel it?','Brave ladder: tiny steps toward fear','Calm breathing before bed'], displayOrder: 5 },
            { title: 'Sleep Issues', slug: 'sleep', ageGroups: ['0-5','6-12','13-17'], signs: ['Difficulty falling asleep','Frequent nightmares','Waking during the night','Tiredness during the day'], whatToDo: ['Create a consistent bedtime routine','Reduce screens 1 hour before bed','Keep room cool and dark','Use calming activities: reading, gentle music'], whatToAvoid: ['Screen time in bed','Sugary snacks before sleep','Irregular sleep schedule on weekends','Punishing for not sleeping'], conversationStarters: ['What helps you feel relaxed before bed?','Is something on your mind that makes it hard to sleep?'], whenToSeekHelp: ['Sleep issues persist more than 3 weeks','Night terrors are frequent','Daytime functioning is affected','Child is afraid to sleep alone past expected age'], activities: ['Create a wind-down chart together','Guided visualization: safe place','Gentle stretching before bed','Gratitude: 3 good things from today'], displayOrder: 6 }
        ],
        safetyRules: [
            { keyword: 'self-harm', responseTitle: 'Safety First', responseText: 'If a child is harming themselves, this needs immediate professional support. Contact your child\'s doctor, a crisis helpline (988), or go to your nearest emergency room.', severity: 'critical' },
            { keyword: 'abuse', responseTitle: 'Protect the Child', responseText: 'If a child is being abused, contact local child protective services or call the Childhelp National Child Abuse Hotline: 1-800-422-4453.', severity: 'critical' },
            { keyword: 'suicidal', responseTitle: 'Immediate Help Needed', responseText: 'If a child is expressing suicidal thoughts, stay with them, remove harmful objects, and call 988 (Suicide & Crisis Lifeline) immediately.', severity: 'critical' }
        ]
    }, { upsert: true });
    console.log('✅ Child Support page seeded');

    // ===== PARENTING PAGE =====
    await ParentingPage.findOneAndUpdate({ key: 'singleton' }, {
        key: 'singleton',
        hero: {
            title: 'Parenting Support',
            subtitle: 'Build calmer communication, stronger routines, and deeper connection with your child.',
            primaryCta: 'Choose Your Focus'
        },
        focusAreas: [
            { title: 'Better Communication', slug: 'communication', icon: '💬', description: 'Learn to listen and speak so your child actually hears you', skills: ['Active listening','Open-ended questions','Reflective responses','Calm tone'], scripts: [{ situation: 'Child refuses to talk', sayThis: 'I am here whenever you are ready. No rush.', avoidThis: 'Why won\'t you just tell me what is wrong?' },{ situation: 'Child is upset after school', sayThis: 'It sounds like today was hard. Do you want to talk or just sit together?', avoidThis: 'What happened NOW?' }], activities: ['5-minute listening without interrupting','Ask one open question at dinner','Mirror their feelings back'], displayOrder: 1 },
            { title: 'Anger Control', slug: 'anger-control', icon: '🌡️', description: 'Respond instead of react when emotions run high', skills: ['Pause before reacting','Name your own emotion','Repair after mistakes','Model calm behavior'], scripts: [{ situation: 'You feel about to shout', sayThis: 'I need a moment. I am going to take a breath before we continue.', avoidThis: 'Shouting, threatening, or slamming doors' },{ situation: 'After you shouted', sayThis: 'I am sorry I raised my voice. I was frustrated, but I should have handled it differently.', avoidThis: 'Pretending it didn\'t happen or blaming the child' }], activities: ['Count to 10 before responding','Leave the room for 60 seconds if needed','Write down triggers at end of day'], displayOrder: 2 },
            { title: 'Calm Discipline', slug: 'discipline', icon: '⚖️', description: 'Set boundaries without shouting or shaming', skills: ['Natural consequences','Clear expectations','Follow through consistently','Separate behavior from child\'s worth'], scripts: [{ situation: 'Child breaks a rule', sayThis: 'The rule was no screen after 8pm. Tomorrow you can try again.', avoidThis: 'You ALWAYS do this! What is wrong with you?' },{ situation: 'Child refuses chores', sayThis: 'Chores come before screen time. Which one would you like to start with?', avoidThis: 'If you don\'t do it RIGHT NOW...' }], activities: ['Write 3 house rules together','Use when-then language','Praise cooperation when it happens'], displayOrder: 3 },
            { title: 'Screen Time Balance', slug: 'screen-time', icon: '📱', description: 'Create healthy boundaries around technology', skills: ['Family media plan','Device-free zones','Replacement activities','Lead by example'], scripts: [{ situation: 'Child argues about screen time', sayThis: 'Screen time is over for now. What else sounds fun?', avoidThis: 'Fine, just 10 more minutes (repeated endlessly)' }], activities: ['Create a family tech agreement','Plan one screen-free evening per week','Find one replacement activity together'], displayOrder: 4 },
            { title: 'Teen Communication', slug: 'teen-communication', icon: '🧑‍🤝‍🧑', description: 'Connect with your teenager without lectures or conflict', skills: ['Listen more than talk','Respect privacy boundaries','Stay curious not controlling','Validate their perspective'], scripts: [{ situation: 'Teen shuts you out', sayThis: 'I respect your space. I just want you to know I care.', avoidThis: 'Tell me what is going on right now!' },{ situation: 'Teen makes a mistake', sayThis: 'What did you learn from this? I trust you to figure it out.', avoidThis: 'I told you so. You never listen.' }], activities: ['Car conversations (side-by-side talks)','Share something vulnerable about your own teen years','Ask: What is something I do that annoys you?'], displayOrder: 5 },
            { title: 'Building Confidence', slug: 'confidence', icon: '⭐', description: 'Help your child develop self-belief and resilience', skills: ['Praise effort over outcome','Let them struggle safely','Celebrate small wins','Avoid over-rescuing'], scripts: [{ situation: 'Child says "I can\'t do it"', sayThis: 'It is hard, and you are still learning. What part can you try first?', avoidThis: 'Just try harder!' }], activities: ['Let them solve one problem alone today','Notice and name one strength you see','Ask: What are you proud of this week?'], displayOrder: 6 }
        ],
        challenges: [
            { title: '7-Day Connection Challenge', description: 'One small action each day to strengthen your bond', durationDays: 7, days: [
                { day: 1, task: 'Listen without interrupting for 5 minutes', reflectionPrompt: 'What did you learn by just listening?' },
                { day: 2, task: 'Praise effort, not result', reflectionPrompt: 'How did your child respond to effort-based praise?' },
                { day: 3, task: 'Replace one command with one choice', reflectionPrompt: 'Did offering a choice reduce resistance?' },
                { day: 4, task: 'Create or follow a bedtime routine together', reflectionPrompt: 'How did bedtime feel tonight compared to usual?' },
                { day: 5, task: 'Ask one open-ended question', reflectionPrompt: 'What surprising thing did you learn?' },
                { day: 6, task: 'Repair one past argument or misunderstanding', reflectionPrompt: 'How did it feel to apologize or acknowledge?' },
                { day: 7, task: 'Family reflection: what went well this week?', reflectionPrompt: 'What one thing will you keep doing?' }
            ] },
            { title: '5-Day Calm Parenting Reset', description: 'Reset your reactions and find calmer responses', durationDays: 5, days: [
                { day: 1, task: 'Pause 5 seconds before every response today', reflectionPrompt: 'When was it hardest to pause?' },
                { day: 2, task: 'Use a calm voice even when frustrated', reflectionPrompt: 'How did your child respond to the calmer tone?' },
                { day: 3, task: 'Say "I need a moment" instead of reacting', reflectionPrompt: 'Did stepping away help you think clearer?' },
                { day: 4, task: 'Apologize for one reaction you regret', reflectionPrompt: 'How did repair feel for both of you?' },
                { day: 5, task: 'Notice your triggers — write down 3', reflectionPrompt: 'Which trigger surprised you most?' }
            ] }
        ],
        parentSelfCare: {
            title: 'Parent Self-Care',
            description: 'When parents meet their own mental and physical needs, it benefits both their well-being and their children.',
            tips: ['Take 2 minutes to breathe before reacting','Sleep is not lazy — it is essential','Ask for help when you need it','You do not have to be perfect to be a good parent','Burnout signs: constant irritability, exhaustion, resentment — these are signals, not failures','One calm moment today is enough']
        }
    }, { upsert: true });
    console.log('✅ Parenting page seeded');

    console.log('\n🎉 Care Hub (Self-Care, Child Support, Parenting) seeded!');
    process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
