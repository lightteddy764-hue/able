// ===== ABLE AI Assistant - Mental Wellness Chatbot =====
// Based on ABLE Flowchart - Triage and Assessment System

class ABLEAssistant {
    constructor() {
        this.conversationState = 'greeting';
        this.userData = {
            name: '',
            age: '',
            mentalState: '',
            concerns: '',
            whodasAnswers: {},
            whodasScore: 0,
            severityLevel: ''
        };
        this.currentQuestion = 0;
        this.whodasQuestions = this.getWHODASQuestions();
        this.chatHistory = [];
        
        // Load saved conversation from localStorage
        this.loadConversation();
        
        this.initializeChatbot();
    }

    // Save conversation to localStorage
    saveConversation() {
        const conversationData = {
            state: this.conversationState,
            userData: this.userData,
            currentQuestion: this.currentQuestion,
            chatHistory: this.chatHistory,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('ableChat', JSON.stringify(conversationData));
    }

    // Load conversation from localStorage
    loadConversation() {
        const savedData = localStorage.getItem('ableChat');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // Check if data is from within last 24 hours
                const savedTime = new Date(data.timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.conversationState = data.state;
                    this.userData = data.userData;
                    this.currentQuestion = data.currentQuestion;
                    this.chatHistory = data.chatHistory;
                    console.log('💬 Previous conversation restored');
                } else {
                    // Clear old conversation
                    this.clearConversation();
                }
            } catch (error) {
                console.error('Error loading conversation:', error);
                this.clearConversation();
            }
        }
    }

    // Clear conversation from localStorage
    clearConversation() {
        localStorage.removeItem('ableChat');
        this.chatHistory = [];
        this.conversationState = 'greeting';
        this.userData = {
            name: '',
            age: '',
            mentalState: '',
            concerns: '',
            whodasAnswers: {},
            whodasScore: 0,
            severityLevel: ''
        };
        this.currentQuestion = 0;
    }

    // Restore chat messages to UI
    restoreChatMessages() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;

        // Clear existing messages (except initial greeting if present)
        const existingMessages = messagesContainer.querySelectorAll('.chatbot-message');
        existingMessages.forEach(msg => {
            if (!msg.classList.contains('initial-greeting')) {
                msg.remove();
            }
        });

        // Restore saved messages
        this.chatHistory.forEach(msg => {
            if (msg.sender === 'user') {
                this.displayUserMessage(msg.text, msg.time);
            } else {
                this.displayBotMessage(msg.text, msg.time);
            }
        });
    }

    initializeChatbot() {
        // Check if chatbot elements exist
        const chatbotButton = document.getElementById('chatbotButton');
        const chatbotWidget = document.getElementById('chatbotWidget');
        const chatbotClose = document.getElementById('chatbotClose');
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotSend = document.getElementById('chatbotSend');

        if (!chatbotButton || !chatbotWidget) return;

        // Restore previous chat messages
        if (this.chatHistory.length > 0) {
            this.restoreChatMessages();
        } else {
            // Only show initial greeting if no conversation exists
            this.showInitialGreeting();
        }

        // Toggle chatbot
        chatbotButton.addEventListener('click', () => {
            chatbotWidget.classList.toggle('active');
            if (chatbotWidget.classList.contains('active')) {
                chatbotInput.focus();
                
                // Show continuation message if conversation exists
                if (this.chatHistory.length > 0 && this.userData.name) {
                    // Scroll to bottom
                    const messagesContainer = document.getElementById('chatbotMessages');
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        });

        // Close chatbot
        chatbotClose.addEventListener('click', () => {
            chatbotWidget.classList.remove('active');
        });

        // Add "Clear Chat" button functionality
        this.addClearChatButton();

        // Send message
        chatbotSend.addEventListener('click', () => this.handleUserMessage());
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (chatbotWidget.classList.contains('active') && 
                !chatbotWidget.contains(e.target) && 
                !chatbotButton.contains(e.target)) {
                chatbotWidget.classList.remove('active');
            }
        });
    }

    // Add clear chat button to header
    addClearChatButton() {
        const chatbotHeader = document.querySelector('.chatbot-header-content');
        if (!chatbotHeader || document.getElementById('clearChatBtn')) return;

        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearChatBtn';
        clearBtn.className = 'clear-chat-btn';
        clearBtn.title = 'Clear conversation';
        clearBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Clear this conversation? This cannot be undone.')) {
                this.clearConversation();
                
                // Clear all messages except initial greeting
                const messagesContainer = document.getElementById('chatbotMessages');
                const messages = messagesContainer.querySelectorAll('.chatbot-message');
                messages.forEach(msg => {
                    if (!msg.classList.contains('initial-greeting')) {
                        msg.remove();
                    }
                });
                
                this.showSystemMessage('Conversation cleared. How can I help you today?');
            }
        });

        chatbotHeader.appendChild(clearBtn);
    }

    showSystemMessage(text) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message system-message';
        messageDiv.style.cssText = 'text-align: center; padding: 0.5rem; opacity: 0.7;';
        messageDiv.innerHTML = `<small>${text}</small>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show initial greeting message (static, not in conversation flow)
    showInitialGreeting() {
        const messagesContainer = document.getElementById('chatbotMessages');
        if (!messagesContainer) return;

        const greetingDiv = document.createElement('div');
        greetingDiv.className = 'chatbot-message bot-message initial-greeting';
        greetingDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#DE7425"/>
                    <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="9" cy="10" r="1.5" fill="white"/>
                    <circle cx="15" cy="10" r="1.5" fill="white"/>
                </svg>
            </div>
            <div class="message-content">
                <p>Hello! 👋 I'm your ABLE Wellness Assistant. I'm here to guide you on your journey to mental wellness. What's your name?</p>
            </div>
        `;
        messagesContainer.appendChild(greetingDiv);
    }

    sendGreeting() {
        // Don't send greeting if chat history exists (already greeted)
        if (this.chatHistory.length > 0) return;
        
        const greeting = "Welcome to ABLE! I'm here to assist you on your journey to mental wellness. Let's start by getting to know you better. What's your name?";
        this.addBotMessage(greeting);
        this.conversationState = 'collectingName';
    }

    handleUserMessage() {
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();
        
        if (message === '') return;

        // Remove any existing quick reply buttons
        this.removeQuickReplies();

        // Add user message
        this.addUserMessage(message);
        input.value = '';

        // If first message and still in greeting state, treat it as name
        if (this.conversationState === 'greeting') {
            this.conversationState = 'collectingName';
        }

        // Process based on conversation state
        setTimeout(() => this.processMessage(message), 800);
    }

    processMessage(message) {
        const lowerMessage = message.toLowerCase();

        // Handle crisis keywords immediately
        if (this.detectCrisis(lowerMessage)) {
            this.handleCrisis();
            return;
        }

        // State machine for conversation flow
        switch (this.conversationState) {
            case 'collectingName':
                this.userData.name = message;
                this.addBotMessage(`Nice to meet you, ${this.userData.name}! How old are you?`);
                setTimeout(() => {
                    this.showQuickReplies([
                        { label: 'Skip', value: 'skip' }
                    ]);
                }, 1200);
                this.conversationState = 'collectingAge';
                break;

            case 'collectingAge':
                const lowerAge = message.toLowerCase();
                // Allow user to skip age
                if (lowerAge.includes('skip') || lowerAge.includes('prefer not') || lowerAge.includes('dont want') || lowerAge.includes("don't want") || lowerAge.includes('rather not')) {
                    this.userData.age = null;
                    this.addBotMessage("No worries, that's perfectly fine! How are you feeling today? Please describe your current mental state.");
                    this.conversationState = 'collectingMentalState';
                } else {
                    const age = parseInt(message);
                    if (isNaN(age) || age < 1 || age > 150) {
                        this.addBotMessage("Please enter a valid age, or say 'skip' if you'd prefer not to share.");
                        return;
                    }
                    this.userData.age = age;
                    this.addBotMessage("Thank you. How are you feeling today? Please describe your current mental state.");
                    this.conversationState = 'collectingMentalState';
                }
                break;

            case 'collectingMentalState':
                this.userData.mentalState = message;
                this.addBotMessage("I appreciate you sharing that with me. Do you have any specific concerns or issues you'd like to address?");
                this.conversationState = 'collectingConcerns';
                break;

            case 'collectingConcerns':
                this.userData.concerns = message;
                this.addBotMessage("Thank you for sharing. To better understand how I can help you, I'd like to ask you some questions about any difficulties you may have experienced in the past 30 days.");
                setTimeout(() => {
                    this.addBotMessage("These questions are part of the WHODAS 2.0 assessment, which helps us personalize your wellness journey. Shall we begin?");
                    this.conversationState = 'confirmAssessment';
                    setTimeout(() => {
                        this.showQuickReplies([
                            { label: '✅ Yes, let\'s start', value: 'yes' },
                            { label: '⏭️ Skip assessment', value: 'no' }
                        ]);
                    }, 1200);
                }, 1000);
                break;

            case 'confirmAssessment':
                if (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('ok') || lowerMessage.includes('begin') || lowerMessage.includes('start')) {
                    this.startWHODASAssessment();
                } else if (lowerMessage.includes('no') || lowerMessage.includes('skip') || lowerMessage.includes('dont') || lowerMessage.includes("don't") || lowerMessage.includes('not') || lowerMessage.includes('nah') || lowerMessage.includes('pass')) {
                    this.skipToServices();
                } else {
                    this.addBotMessage("No worries! Would you like to take the quick wellness assessment, or shall I skip ahead and show you our services? (yes/no)");
                }
                break;

            case 'whodasAssessment':
                this.handleWHODASResponse(message);
                break;

            case 'completed':
                this.handleGeneralQuery(message);
                break;

            default:
                this.handleGeneralQuery(message);
        }
    }

    startWHODASAssessment() {
        this.conversationState = 'whodasAssessment';
        this.currentQuestion = 0;
        this.currentDomain = '';
        this.addBotMessage("Great! I'll ask you 32 questions across 6 life domains. For each question, please respond with:");
        setTimeout(() => {
            this.addBotMessage("0 = None\n1 = Mild\n2 = Moderate\n3 = Severe\n4 = Extreme or cannot do\n\nThese refer to difficulties in the last 30 days due to health/mental health conditions. Let's begin!");
            setTimeout(() => this.askNextWHODASQuestion(), 1500);
        }, 1000);
    }

    askNextWHODASQuestion() {
        if (this.currentQuestion < this.whodasQuestions.length) {
            const question = this.whodasQuestions[this.currentQuestion];
            
            // Show domain header when entering a new domain
            if (question.domain !== this.currentDomain) {
                this.currentDomain = question.domain;
                const domainEmojis = {
                    'Understanding and Communicating': '🧠',
                    'Getting Around': '🚶',
                    'Self-care': '🛁',
                    'Getting Along with People': '🤝',
                    'Life Activities': '🏠',
                    'Participation in Society': '🌍'
                };
                const emoji = domainEmojis[question.domain] || '📋';
                this.addBotMessage(`${emoji} **Domain ${question.domainNum}: ${question.domain}**`);
                setTimeout(() => {
                    this.addBotMessage(`Q${this.currentQuestion + 1}/${this.whodasQuestions.length}: ${question.text}`);
                    setTimeout(() => {
                        this.showQuickReplies([
                            { label: '0 None', value: '0' },
                            { label: '1 Mild', value: '1' },
                            { label: '2 Moderate', value: '2' },
                            { label: '3 Severe', value: '3' },
                            { label: '4 Extreme', value: '4' }
                        ]);
                    }, 800);
                }, 1200);
            } else {
                this.addBotMessage(`Q${this.currentQuestion + 1}/${this.whodasQuestions.length}: ${question.text}`);
                setTimeout(() => {
                    this.showQuickReplies([
                        { label: '0 None', value: '0' },
                        { label: '1 Mild', value: '1' },
                        { label: '2 Moderate', value: '2' },
                        { label: '3 Severe', value: '3' },
                        { label: '4 Extreme', value: '4' }
                    ]);
                }, 800);
            }
        } else {
            this.completeWHODASAssessment();
        }
    }

    handleWHODASResponse(message) {
        const score = parseInt(message);
        
        if (isNaN(score) || score < 0 || score > 4) {
            this.addBotMessage("Please respond with a number from 0 to 4:\n0 = None\n1 = Mild\n2 = Moderate\n3 = Severe\n4 = Extreme or cannot do");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '0 None', value: '0' },
                    { label: '1 Mild', value: '1' },
                    { label: '2 Moderate', value: '2' },
                    { label: '3 Severe', value: '3' },
                    { label: '4 Extreme', value: '4' }
                ]);
            }, 800);
            return;
        }

        // Store answer
        this.userData.whodasAnswers[this.currentQuestion] = score;
        this.currentQuestion++;

        // Save progress
        this.saveConversation();
        
        // Show progress every 8 questions
        if (this.currentQuestion < this.whodasQuestions.length && this.currentQuestion % 8 === 0) {
            const progress = Math.round((this.currentQuestion / this.whodasQuestions.length) * 100);
            this.addBotMessage(`📊 Progress: ${progress}% complete (${this.currentQuestion}/${this.whodasQuestions.length} questions). You're doing great, keep going!`);
            setTimeout(() => this.askNextWHODASQuestion(), 1200);
        } else {
            // Ask next question
            setTimeout(() => this.askNextWHODASQuestion(), 500);
        }
    }

    completeWHODASAssessment() {
        // Calculate total score
        const answers = Object.values(this.userData.whodasAnswers);
        this.userData.whodasScore = answers.reduce((a, b) => a + b, 0);
        const maxScore = this.whodasQuestions.length * 4; // 32 questions * 4 = 128
        const percentage = (this.userData.whodasScore / maxScore) * 100;

        // Calculate domain scores
        const domainScores = {};
        this.whodasQuestions.forEach((q, index) => {
            if (!domainScores[q.domain]) {
                domainScores[q.domain] = { total: 0, max: 0, questions: 0 };
            }
            domainScores[q.domain].total += (this.userData.whodasAnswers[index] || 0);
            domainScores[q.domain].max += 4;
            domainScores[q.domain].questions++;
        });

        this.userData.domainScores = domainScores;

        // Determine severity based on WHODAS 2.0 scoring guidelines
        // Scores: 0-24% = None/Mild, 25-49% = Moderate, 50-95% = Severe, 96-100% = Complete
        if (percentage >= 50) {
            this.userData.severityLevel = 'severe';
        } else if (percentage >= 25) {
            this.userData.severityLevel = 'moderate';
        } else {
            this.userData.severityLevel = 'mild';
        }

        // Save conversation state
        this.saveConversation();

        // Show results
        this.addBotMessage("✅ Assessment complete! Let me analyze your responses...");
        
        setTimeout(() => {
            // Show domain breakdown
            let domainSummary = "📊 **Your WHODAS 2.0 Results:**\n\n";
            const domainEmojis = {
                'Understanding and Communicating': '🧠',
                'Getting Around': '🚶',
                'Self-care': '🛁',
                'Getting Along with People': '🤝',
                'Life Activities': '🏠',
                'Participation in Society': '🌍'
            };

            Object.entries(domainScores).forEach(([domain, data]) => {
                const domainPercent = Math.round((data.total / data.max) * 100);
                const emoji = domainEmojis[domain] || '📋';
                let level = 'Low';
                if (domainPercent >= 50) level = 'High';
                else if (domainPercent >= 25) level = 'Moderate';
                domainSummary += `${emoji} ${domain}: ${level} (${domainPercent}%)\n`;
            });

            domainSummary += `\n**Overall Score:** ${this.userData.whodasScore}/${maxScore} (${Math.round(percentage)}%)`;
            this.addBotMessage(domainSummary);

            setTimeout(() => {
                if (this.userData.severityLevel === 'severe') {
                    this.referToPsychiatrist();
                } else {
                    this.suggestServices();
                }
                this.conversationState = 'completed';
            }, 2500);
        }, 2000);
    }

    referToPsychiatrist() {
        this.addBotMessage(`${this.userData.name}, based on your responses, your assessment indicates significant challenges in daily functioning. I want to make sure you get the best support possible.`);
        
        setTimeout(() => {
            this.addBotMessage("🚨 **Immediate Support Resources:**\n\n• National Suicide Prevention Lifeline: **988**\n• Crisis Text Line: Text **HOME** to **741741**\n• SAMHSA Helpline: **1-800-662-4357** (free, 24/7)\n• Emergency Services: **911**\n\nThese services are free, confidential, and available 24/7.");
        }, 1500);

        setTimeout(() => {
            this.addBotMessage("🌸 **I strongly recommend connecting with a professional therapist.** Our Enable-Healing Zone has licensed, verified therapists who specialize in:\n\n• Depression & anxiety\n• Trauma & PTSD\n• Crisis intervention\n• Ongoing mental health support");
        }, 3500);

        setTimeout(() => {
            this.addBotMessage("While professional support is the priority, you can also explore our other wellness tools as complementary support. Would you like to:");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🌸 Find a Therapist Now', value: 'Help me find a therapist' },
                    { label: '📞 More Crisis Resources', value: 'Show me more crisis resources' },
                    { label: '🧘 Explore Wellness Tools', value: 'Show me other services' },
                    { label: '💬 Keep Talking', value: 'I want to keep talking' }
                ]);
            }, 1200);
        }, 5500);
    }

    suggestServices() {
        const severity = this.userData.severityLevel;
        const domainScores = this.userData.domainScores || {};
        
        let message = `Thank you for completing the assessment, ${this.userData.name}. `;
        
        if (severity === 'mild') {
            message += "Great news — your responses suggest you're managing well overall! Here are services to support your continued wellness journey:";
        } else if (severity === 'moderate') {
            message += "Your responses indicate some areas where additional support could help. I've personalized these recommendations based on your specific needs:";
        }
        
        this.addBotMessage(message);

        // Personalized recommendations based on domain scores
        const recommendations = [];

        // Always recommend Healing Zone for moderate
        if (severity === 'moderate') {
            recommendations.push({ delay: 1500, text: "🌸 **Enable-Healing Zone** (Recommended): Connect with licensed therapists who can address your specific challenges. Personalized sessions, flexible scheduling, secure communication." });
        } else {
            recommendations.push({ delay: 1500, text: "🌸 **Enable-Healing Zone**: Connect with licensed and verified therapists for personalized therapy sessions whenever you need support." });
        }

        // Body-Mind - especially if self-care or getting around scores are elevated
        const selfCareScore = domainScores['Self-care'];
        const gettingAroundScore = domainScores['Getting Around'];
        if ((selfCareScore && (selfCareScore.total / selfCareScore.max) >= 0.25) || 
            (gettingAroundScore && (gettingAroundScore.total / gettingAroundScore.max) >= 0.25)) {
            recommendations.push({ delay: 3000, text: "🧘 **Capable-Body-Mind Connection** (Suggested for you): Yoga, breathing techniques, nutrition for mental wellness, and routine management can help with the physical challenges you mentioned." });
        } else {
            recommendations.push({ delay: 3000, text: "🧘 **Capable-Body-Mind Connection**: Holistic health practices including nutrition advice, guided yoga, breathing techniques, and routine management." });
        }

        // Community - especially if getting along/participation scores are elevated
        const gettingAlongScore = domainScores['Getting Along with People'];
        const participationScore = domainScores['Participation in Society'];
        if ((gettingAlongScore && (gettingAlongScore.total / gettingAlongScore.max) >= 0.25) || 
            (participationScore && (participationScore.total / participationScore.max) >= 0.25)) {
            recommendations.push({ delay: 4500, text: "👥 **Suitable-Community Circle** (Suggested for you): Our Mental Spa, Wellness Dating, and Wellness Meetups can help build connections and reduce isolation." });
        } else {
            recommendations.push({ delay: 4500, text: "👥 **Suitable-Community Circle**: Join our Mental Spa, Wellness Dating, and Wellness Meetups to build meaningful connections." });
        }

        // Youth Support - if age is under 25
        if (this.userData.age && this.userData.age < 25) {
            recommendations.push({ delay: 6000, text: "🎓 **Viable-Youth Support** (Perfect for your age group!): Aptitude testing, career advising, and wellness support for anxiety, body-image issues, and bullying." });
        } else {
            recommendations.push({ delay: 6000, text: "🎓 **Viable-Youth Support**: Dedicated services for young people including aptitude testing, career advising, and wellness support." });
        }

        // Voice Platform
        recommendations.push({ delay: 7500, text: "💬 **Valuable-Voice Platform**: Share your story, read others' journeys, and connect with our supportive community. Your voice matters!" });

        // Display recommendations with delays
        recommendations.forEach(rec => {
            setTimeout(() => this.addBotMessage(rec.text), rec.delay);
        });

        setTimeout(() => {
            this.addBotMessage("Which service would you like to explore first? Or ask me anything about your wellness journey!");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '🧘 Body-Mind', value: 'Tell me about Capable-Body-Mind Connection' },
                    { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                    { label: '🎓 Youth', value: 'Tell me about Viable-Youth Support' },
                    { label: '💬 Voice', value: 'Tell me about Valuable-Voice Platform' },
                    { label: '📝 Sign Up', value: 'How do I sign up?' }
                ]);
            }, 1200);
        }, 9000);
    }

    skipToServices() {
        this.addBotMessage("No problem! Let me share our wellness services with you:");
        setTimeout(() => {
            this.suggestServicesWithoutAssessment();
            this.conversationState = 'completed';
        }, 1000);
    }

    suggestServicesWithoutAssessment() {
        this.addBotMessage(`Thank you for chatting with me, ${this.userData.name}. Here are the wellness services we offer:`);

        setTimeout(() => {
            this.addBotMessage("🌸 **Enable-Healing Zone**: Connect with world-class licensed and verified therapists to help you in your wellness journey.");
        }, 1500);

        setTimeout(() => {
            this.addBotMessage("🧘 **Capable-Body-Mind Connection**: Benefit from holistic health practices including nutrition advice, yoga, breathing techniques, and routine management.");
        }, 3000);

        setTimeout(() => {
            this.addBotMessage("👥 **Suitable-Community Circle**: Join our Mental Spa, Wellness Dating, and Wellness Meetups.");
        }, 4500);

        setTimeout(() => {
            this.addBotMessage("🎓 **Viable-Youth Support**: " + (this.userData.age < 25 ? "Perfect for you!" : "Great for younger family members!") + " Aptitude testing, career advising, and wellness support.");
        }, 6000);

        setTimeout(() => {
            this.addBotMessage("💬 **Valuable-Voice Platform**: Share your story, experience, and connect with our supportive community.");
        }, 7500);

        setTimeout(() => {
            this.addBotMessage("Which service interests you most? Or ask me anything!");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '🧘 Body-Mind', value: 'Tell me about Capable-Body-Mind Connection' },
                    { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                    { label: '🎓 Youth', value: 'Tell me about Viable-Youth Support' },
                    { label: '💬 Voice', value: 'Tell me about Valuable-Voice Platform' },
                    { label: '📝 Sign Up', value: 'How do I sign up?' }
                ]);
            }, 1200);
        }, 9000);
    }

    detectCrisis(message) {
        const crisisKeywords = ['suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'harm myself', 'hurt myself'];
        return crisisKeywords.some(keyword => message.includes(keyword));
    }

    handleCrisis() {
        this.addBotMessage("🚨 I'm concerned about what you've shared. Your safety is the top priority.");
        setTimeout(() => {
            this.addBotMessage("Please reach out for immediate help:\n\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: 911\n\nThese services are available 24/7 and there are people who want to help you right now.");
        }, 1500);
        setTimeout(() => {
            this.addBotMessage("Please know that you're not alone, and there is hope. Would you like me to help you find additional support resources?");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🌸 Find a Therapist', value: 'Help me find a therapist' },
                    { label: '📞 More Resources', value: 'Show me more crisis resources' },
                    { label: '💬 Keep Talking', value: 'I want to keep talking' }
                ]);
            }, 1200);
        }, 3500);
    }

    async handleGeneralQuery(message) {
        const lowerMessage = message.toLowerCase();

        // Show loading state
        this.showTypingIndicator();

        try {
            // Call backend AI endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.chatHistory.slice(-10), // Last 10 messages for context
                    userData: {
                        name: this.userData.name,
                        age: this.userData.age,
                        severityLevel: this.userData.severityLevel
                    }
                })
            });

            const data = await response.json();
            
            this.hideTypingIndicator();

            if (data.response) {
                // Add AI or fallback response
                const responseText = data.response;
                const time = new Date().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });

                // Save to history
                this.chatHistory.push({
                    sender: 'bot',
                    text: responseText,
                    time: time,
                    timestamp: new Date().toISOString(),
                    source: data.source || 'ai'
                });
                this.saveConversation();

                // Display message immediately (no additional typing delay)
                this.displayBotMessage(responseText, time);

                // Add AI badge if powered by AI
                if (data.source === 'ai') {
                    this.addAIBadge();
                }

                // Show quick replies after AI response
                setTimeout(() => {
                    this.showQuickReplies([
                        { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                        { label: '🧘 Body-Mind', value: 'Tell me about Capable-Body-Mind Connection' },
                        { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                        { label: '📝 Sign Up', value: 'How do I sign up?' }
                    ]);
                }, 300);
            } else {
                // Fallback to local responses if API fails
                this.hideTypingIndicator();
                this.handleLocalQuery(message);
            }
        } catch (error) {
            console.error('AI request failed:', error);
            this.hideTypingIndicator();
            // Fallback to local keyword-based responses
            this.handleLocalQuery(message);
        }
    }

    // Fallback local query handler (original keyword-based logic)
    handleLocalQuery(message) {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('find a therapist') || lowerMessage.includes('healing zone') || lowerMessage.includes('enable')) {
            this.addBotMessage("🌸 **Enable-Healing Zone**\n\nOur Healing Zone connects you with world-class licensed and verified therapists who specialize in:\n\n• Depression & Anxiety\n• Trauma & PTSD\n• Relationship Issues\n• Stress Management\n• Crisis Support\n\n**Features:**\n• Personalized therapy sessions\n• Flexible scheduling\n• Confidential & secure communication\n• Verified professionals only");
            setTimeout(() => {
                this.addBotMessage("Ready to connect with a therapist? Sign up or log in to browse available therapists and book your first session.");
                setTimeout(() => {
                    this.showQuickReplies([
                        { label: '📝 Sign Up Now', value: 'How do I sign up?' },
                        { label: '🧘 Body-Mind', value: 'Tell me about Capable-Body-Mind Connection' },
                        { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                        { label: '← Back to All Services', value: 'Show me all services' }
                    ]);
                }, 800);
            }, 1500);
        } else if (lowerMessage.includes('body') || lowerMessage.includes('mind') || lowerMessage.includes('yoga') || lowerMessage.includes('nutrition') || lowerMessage.includes('breathing') || lowerMessage.includes('capable')) {
            this.addBotMessage("🧘 **Capable-Body-Mind Connection**\n\nExperience the power of holistic health! Nourish your mind and body with:\n\n• 🥗 **Nutritional Advice** — Food that fosters mental wellness\n• 🧘 **Guided Yoga** — Sessions that elevate your spirit\n• 🌬️ **Breathing Techniques** — Exercises that bring calm\n• 📅 **Routine Management** — Organize your life for harmony\n\n**Benefits:** Stress reduction, improved focus, better sleep, balanced lifestyle.");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '📝 Sign Up Now', value: 'How do I sign up?' },
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                    { label: '← Back to All Services', value: 'Show me all services' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('community') || lowerMessage.includes('meetup') || lowerMessage.includes('dating') || lowerMessage.includes('spa') || lowerMessage.includes('suitable') || lowerMessage.includes('circle')) {
            this.addBotMessage("👥 **Suitable-Community Circle**\n\nDive into community-centric wellness experiences:\n\n• 🧖 **Mental Spa** — Immersive relaxation sessions to find tranquility\n• 💕 **Wellness Dating** — Meet souls on the same frequency\n• 🤝 **Wellness Meetups** — Group activities focused on mental well-being\n\n**Benefits:** Sense of belonging, meaningful relationships, shared growth, reduced isolation.");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '📝 Sign Up Now', value: 'How do I sign up?' },
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '🎓 Youth Support', value: 'Tell me about Viable-Youth Support' },
                    { label: '← Back to All Services', value: 'Show me all services' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('youth') || lowerMessage.includes('career') || lowerMessage.includes('young') || lowerMessage.includes('aptitude') || lowerMessage.includes('viable') || lowerMessage.includes('bullying')) {
            this.addBotMessage("🎓 **Viable-Youth Support**\n\nDedicated support for children and young adults (ages 13-24):\n\n• 📊 **Aptitude Testing** — Discover strengths and potential\n• 🎯 **Career Advising** — Guidance for academic and career choices\n• 💪 **Wellness Support** — Help with anxiety, body-image, bullying\n• 🌱 **Personal Development** — Build self-esteem and coping strategies\n\n**Benefits:** Clarity about the future, emotional resilience, healthy development.");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '📝 Sign Up Now', value: 'How do I sign up?' },
                    { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                    { label: '💬 Voice Platform', value: 'Tell me about Valuable-Voice Platform' },
                    { label: '← Back to All Services', value: 'Show me all services' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('story') || lowerMessage.includes('share') || lowerMessage.includes('voice') || lowerMessage.includes('valuable') || lowerMessage.includes('forum')) {
            this.addBotMessage("💬 **Valuable-Voice Platform**\n\nEvery voice matters! Share your journey and inspire others:\n\n• 📝 **Share Stories** — Write about your wellness journey\n• 🤝 **Community Support** — Get feedback and encouragement\n• 🔒 **Anonymous Sharing** — Share without revealing identity\n• 💬 **Forums** — Discuss topics and give/receive advice\n\n**Benefits:** Feel heard, inspire others, learn from shared experiences, build community.");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '📝 Sign Up Now', value: 'How do I sign up?' },
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '🧘 Body-Mind', value: 'Tell me about Capable-Body-Mind Connection' },
                    { label: '← Back to All Services', value: 'Show me all services' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('sign up') || lowerMessage.includes('signup') || lowerMessage.includes('register') || lowerMessage.includes('account') || lowerMessage.includes('join') || lowerMessage.includes('get started')) {
            this.addBotMessage("📝 **Getting Started with ABLE**\n\nSigning up is quick and free!\n\n1. Click the **'Start Your Wellness Journey'** button on the homepage\n2. Fill in your name, email, and create a password\n3. You'll get access to all our wellness tools\n\nOnce registered, you can:\n• Browse and book therapists\n• Access yoga, breathing, and nutrition tools\n• Join community events\n• Share your story\n• Take assessments");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '🧘 Body-Mind', value: 'Tell me about Capable-Body-Mind Connection' },
                    { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                    { label: '📋 Retake Assessment', value: 'I want to retake the assessment' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('all services') || lowerMessage.includes('show me') || lowerMessage.includes('what do you offer') || lowerMessage.includes('services')) {
            this.addBotMessage("Here are all 5 wellness services ABLE offers:\n\n🌸 **Enable-Healing Zone** — Licensed therapist sessions\n🧘 **Capable-Body-Mind** — Yoga, nutrition, breathing\n👥 **Suitable-Community** — Spa, dating, meetups\n🎓 **Viable-Youth Support** — Aptitude, career, youth wellness\n💬 **Valuable-Voice** — Stories, forums, sharing\n\nWhich one interests you?");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '🧘 Body-Mind', value: 'Tell me about Capable-Body-Mind Connection' },
                    { label: '👥 Community', value: 'Tell me about Suitable-Community Circle' },
                    { label: '🎓 Youth', value: 'Tell me about Viable-Youth Support' },
                    { label: '💬 Voice', value: 'Tell me about Valuable-Voice Platform' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('retake') || lowerMessage.includes('assessment again') || lowerMessage.includes('redo')) {
            this.addBotMessage("Sure! Let me reset the assessment for you. Ready to start the WHODAS 2.0 assessment again?");
            this.userData.whodasAnswers = {};
            this.userData.whodasScore = 0;
            this.userData.severityLevel = '';
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '✅ Yes, let\'s start', value: 'yes start assessment' },
                    { label: '❌ No thanks', value: 'Show me all services' }
                ]);
            }, 800);
            this.conversationState = 'confirmAssessment';
        } else if (lowerMessage.includes('crisis') || lowerMessage.includes('emergency') || lowerMessage.includes('resource')) {
            this.addBotMessage("📞 **Crisis & Emergency Resources:**\n\n• **988** — Suicide & Crisis Lifeline (call/text)\n• **741741** — Crisis Text Line (text HOME)\n• **1-800-662-4357** — SAMHSA Helpline (24/7, free)\n• **911** — Emergency Services\n• **IMAlive.org** — Online crisis chat\n• **CrisisChat.org** — Live chat support\n\nYou are not alone. Help is always available. 💛");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🌸 Find a Therapist', value: 'Help me find a therapist' },
                    { label: '← Back to Services', value: 'Show me all services' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('what can you do')) {
            this.addBotMessage("I'm here to help! Here's what I can do:\n\n• 🧭 Guide you through our wellness services\n• 📋 Administer the WHODAS 2.0 assessment\n• 📞 Provide crisis resources\n• ❓ Answer questions about ABLE\n• 🔍 Help you find the right service for your needs\n\nWhat would you like to do?");
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '📋 Take Assessment', value: 'I want to retake the assessment' },
                    { label: '🔍 All Services', value: 'Show me all services' },
                    { label: '📞 Crisis Resources', value: 'Show me more crisis resources' },
                    { label: '📝 Sign Up', value: 'How do I sign up?' }
                ]);
            }, 1000);
        } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
            this.addBotMessage(`You're welcome, ${this.userData.name || 'friend'}! Remember, ABLE is always here for you. Take care of yourself, and don't hesitate to come back anytime. 💛\n\nWishing you wellness and peace! 🌟`);
        } else {
            this.addBotMessage(`I'd love to help you, ${this.userData.name || 'friend'}! Here are some things I can assist with:\n\n• Learn about our 5 wellness services\n• Take or retake the wellness assessment\n• Find crisis support resources\n• Help you get started with ABLE\n\nJust ask about any of these, or try one of the options below!`);
            setTimeout(() => {
                this.showQuickReplies([
                    { label: '🔍 All Services', value: 'Show me all services' },
                    { label: '🌸 Healing Zone', value: 'Tell me about Enable-Healing Zone' },
                    { label: '📋 Assessment', value: 'I want to retake the assessment' },
                    { label: '📝 Sign Up', value: 'How do I sign up?' }
                ]);
            }, 1000);
        }
    }

    // Add AI badge to last message
    addAIBadge() {
        const messages = document.querySelectorAll('.bot-message');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const badge = document.createElement('span');
            badge.className = 'ai-badge';
            badge.innerHTML = '✨ AI';
            badge.style.cssText = 'display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 9px; padding: 2px 6px; border-radius: 8px; margin-left: 6px; font-weight: 600; vertical-align: middle;';
            
            const messageTime = lastMessage.querySelector('.message-time');
            if (messageTime) {
                messageTime.insertAdjacentElement('beforebegin', badge);
            }
        }
    }

    getWHODASQuestions() {
        return [
            // Domain 1: Understanding and Communicating (6 questions)
            { domain: 'Understanding and Communicating', domainNum: 1, text: 'How much difficulty did you have concentrating on doing something for ten minutes?' },
            { domain: 'Understanding and Communicating', domainNum: 1, text: 'How much difficulty did you have remembering to do important things?' },
            { domain: 'Understanding and Communicating', domainNum: 1, text: 'How much difficulty did you have analyzing and finding solutions to problems in day-to-day life?' },
            { domain: 'Understanding and Communicating', domainNum: 1, text: 'How much difficulty did you have learning a new task (e.g., how to get to a new place)?' },
            { domain: 'Understanding and Communicating', domainNum: 1, text: 'How much difficulty did you have generally understanding what people say?' },
            { domain: 'Understanding and Communicating', domainNum: 1, text: 'How much difficulty did you have starting and maintaining a conversation?' },

            // Domain 2: Getting Around (5 questions)
            { domain: 'Getting Around', domainNum: 2, text: 'How much difficulty did you have standing for long periods, such as 30 minutes?' },
            { domain: 'Getting Around', domainNum: 2, text: 'How much difficulty did you have standing up from sitting down?' },
            { domain: 'Getting Around', domainNum: 2, text: 'How much difficulty did you have moving around inside your home?' },
            { domain: 'Getting Around', domainNum: 2, text: 'How much difficulty did you have getting out of your home?' },
            { domain: 'Getting Around', domainNum: 2, text: 'How much difficulty did you have walking a long distance, such as a kilometer?' },

            // Domain 3: Self-care (4 questions)
            { domain: 'Self-care', domainNum: 3, text: 'How much difficulty did you have washing your whole body?' },
            { domain: 'Self-care', domainNum: 3, text: 'How much difficulty did you have getting dressed?' },
            { domain: 'Self-care', domainNum: 3, text: 'How much difficulty did you have eating?' },
            { domain: 'Self-care', domainNum: 3, text: 'How much difficulty did you have staying by yourself for a few days?' },

            // Domain 4: Getting Along with People (5 questions)
            { domain: 'Getting Along with People', domainNum: 4, text: 'How much difficulty did you have dealing with people you do not know?' },
            { domain: 'Getting Along with People', domainNum: 4, text: 'How much difficulty did you have maintaining a friendship?' },
            { domain: 'Getting Along with People', domainNum: 4, text: 'How much difficulty did you have getting along with people who are close to you?' },
            { domain: 'Getting Along with People', domainNum: 4, text: 'How much difficulty did you have making new friends?' },
            { domain: 'Getting Along with People', domainNum: 4, text: 'How much difficulty did you have with sexual activities?' },

            // Domain 5: Life Activities - Household (4 questions)
            { domain: 'Life Activities', domainNum: 5, text: 'How much difficulty did you have taking care of your household responsibilities?' },
            { domain: 'Life Activities', domainNum: 5, text: 'How much difficulty did you have doing most important household tasks well?' },
            { domain: 'Life Activities', domainNum: 5, text: 'How much difficulty did you have getting all of the household work done that you needed to do?' },
            { domain: 'Life Activities', domainNum: 5, text: 'How much difficulty did you have getting your household work done as quickly as needed?' },

            // Domain 6: Participation in Society (8 questions)
            { domain: 'Participation in Society', domainNum: 6, text: 'How much difficulty did you have joining in community activities (e.g., festivities, religious activities)?' },
            { domain: 'Participation in Society', domainNum: 6, text: 'How much difficulty did you have because of barriers or hindrances around you?' },
            { domain: 'Participation in Society', domainNum: 6, text: 'How much difficulty did you have living with dignity because of the attitudes and actions of others?' },
            { domain: 'Participation in Society', domainNum: 6, text: 'How much time did you spend on your health condition?' },
            { domain: 'Participation in Society', domainNum: 6, text: 'How much have you been emotionally affected by your health condition?' },
            { domain: 'Participation in Society', domainNum: 6, text: 'How much has your health been a drain on your financial resources?' },
            { domain: 'Participation in Society', domainNum: 6, text: 'How much difficulty did your family have because of your health problems?' },
            { domain: 'Participation in Society', domainNum: 6, text: 'How much difficulty did you have doing things by yourself for relaxation or pleasure?' }
        ];
    }

    addUserMessage(text) {
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });

        // Save to history
        this.chatHistory.push({
            sender: 'user',
            text: text,
            time: time,
            timestamp: new Date().toISOString()
        });
        this.saveConversation();

        // Display message
        this.displayUserMessage(text, time);
    }

    displayUserMessage(text, time) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message user-message';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="white"/>
                </svg>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(text)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addBotMessage(text, skipTyping = false) {
        const messagesContainer = document.getElementById('chatbotMessages');
        
        if (skipTyping) {
            // Immediate display (for AI responses that already showed typing)
            const time = new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });

            // Save to history
            this.chatHistory.push({
                sender: 'bot',
                text: text,
                time: time,
                timestamp: new Date().toISOString()
            });
            this.saveConversation();

            // Display message
            this.displayBotMessage(text, time);
        } else {
            // Show typing indicator
            this.showTypingIndicator();

            setTimeout(() => {
                this.hideTypingIndicator();
                
                const time = new Date().toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });

                // Save to history
                this.chatHistory.push({
                    sender: 'bot',
                    text: text,
                    time: time,
                    timestamp: new Date().toISOString()
                });
                this.saveConversation();

                // Display message
                this.displayBotMessage(text, time);
            }, 1000);
        }
    }

    displayBotMessage(text, time) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot-message';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#DE7425"/>
                    <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="9" cy="10" r="1.5" fill="white"/>
                    <circle cx="15" cy="10" r="1.5" fill="white"/>
                </svg>
            </div>
            <div class="message-content">
                <p>${this.formatMessage(text)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#DE7425"/>
                    <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="9" cy="10" r="1.5" fill="white"/>
                    <circle cx="15" cy="10" r="1.5" fill="white"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    formatMessage(text) {
        // Convert markdown-style bold to HTML
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert newlines to <br>
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    // Quick reply buttons system
    showQuickReplies(options) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const quickRepliesDiv = document.createElement('div');
        quickRepliesDiv.className = 'quick-replies';
        
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.textContent = option.label || option;
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent close on outside click
                // Remove quick replies once clicked
                quickRepliesDiv.remove();
                // Set input value and trigger send
                const input = document.getElementById('chatbotInput');
                input.value = option.value || option;
                this.handleUserMessage();
            });
            quickRepliesDiv.appendChild(btn);
        });

        messagesContainer.appendChild(quickRepliesDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Remove any existing quick replies
    removeQuickReplies() {
        const existing = document.querySelectorAll('.quick-replies');
        existing.forEach(el => el.remove());
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ableAssistant = new ABLEAssistant();
    });
} else {
    window.ableAssistant = new ABLEAssistant();
}

console.log('🤖 ABLE AI Assistant - Ready to guide your wellness journey!');
