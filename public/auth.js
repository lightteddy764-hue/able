// ===== Form Handling =====

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

// Signup Form Handler - Multi-Step
const signupForm = document.getElementById('signupForm');
let currentStep = 1;
const totalSteps = 3;

if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
    
    // Next buttons
    const nextButtons = signupForm.querySelectorAll('.btn-next');
    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => nextStep());
    });
    
    // Previous buttons
    const prevButtons = signupForm.querySelectorAll('.btn-prev');
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => prevStep());
    });
}

// Password Strength Indicator
const passwordInput = document.getElementById('password');
const passwordStrength = document.getElementById('passwordStrength');

if (passwordInput && passwordStrength) {
    passwordInput.addEventListener('input', updatePasswordStrength);
}

// ===== Multi-Step Navigation =====
function nextStep() {
    if (!validateStep(currentStep)) {
        return;
    }
    
    if (currentStep < totalSteps) {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        currentStepEl.classList.add('slide-out-left');
        
        setTimeout(() => {
            currentStepEl.classList.remove('active', 'slide-out-left');
            currentStep++;
            
            const nextStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            nextStepEl.classList.add('active');
            
            updateProgressIndicator();
            updateStepHeader();
            
            // Focus first input in next step
            const firstInput = nextStepEl.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }, 300);
    }
}

function prevStep() {
    if (currentStep > 1) {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        currentStepEl.classList.add('slide-out-right');
        
        setTimeout(() => {
            currentStepEl.classList.remove('active', 'slide-out-right');
            currentStep--;
            
            const prevStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            prevStepEl.classList.add('active');
            
            updateProgressIndicator();
            updateStepHeader();
            
            // Focus first input in previous step
            const firstInput = prevStepEl.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }, 300);
    }
}

// Keyboard navigation - Enter key to proceed
if (signupForm) {
    signupForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            if (currentStep < totalSteps) {
                nextStep();
            }
        }
    });
}

function updateProgressIndicator() {
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
    
    // Update step lines
    document.querySelectorAll('.step-line').forEach((line, index) => {
        if (index < currentStep - 1) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });
}

function updateStepHeader() {
    const stepTitle = document.getElementById('stepTitle');
    const stepDescription = document.getElementById('stepDescription');
    
    const titles = {
        1: 'Personal Information',
        2: 'Wellness Assessment',
        3: 'Create Password'
    };
    
    const descriptions = {
        1: "Let's start with your basic details",
        2: 'Help us understand your wellness needs (WHODAS 2.0)',
        3: 'Secure your account with a strong password'
    };
    
    if (stepTitle) stepTitle.textContent = titles[currentStep];
    if (stepDescription) stepDescription.textContent = descriptions[currentStep];
}

function validateStep(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = stepEl.querySelectorAll('input[required], select[required]');
    
    for (let input of inputs) {
        if (!input.value.trim()) {
            input.focus();
            showNotification(`Please fill in all required fields`, 'error');
            return false;
        }
        
        // Email validation for step 1
        if (step === 1 && input.type === 'email' && !validateEmail(input.value)) {
            input.focus();
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        // Age validation for step 1
        if (step === 1 && input.name === 'age') {
            const age = parseInt(input.value);
            if (age < 13 || age > 120) {
                input.focus();
                showNotification('Please enter a valid age', 'error');
                return false;
            }
        }
    }
    
    return true;
}

// ===== Login Function =====
function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        if (data.user.assessment) {
            localStorage.setItem('severityLevel', data.user.assessment.severityLevel || '');
            localStorage.setItem('whodasScore', data.user.assessment.whodasScore || 0);
        }
        showNotification('Login successful!', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    })
    .catch(err => {
        showNotification('Connection error. Please try again.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// ===== Signup Function =====
function handleSignup(e) {
    e.preventDefault();
    
    // Final validation for step 3
    if (!validateStep(3)) {
        return;
    }
    
    const formData = new FormData(e.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const age = formData.get('age');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const terms = formData.get('terms');

    // Calculate WHODAS score
    let whodasScore = 0;
    for (let i = 1; i <= 10; i++) {
        const value = formData.get(`whodas_q${i}`);
        whodasScore += parseInt(value || 0);
    }
    
    // Total possible score is 40 (10 questions * 4 max score)
    const severityPercentage = (whodasScore / 40) * 100;
    
    // Determine severity level
    let severityLevel = 'mild';
    if (severityPercentage >= 60) {
        severityLevel = 'severe';
    } else if (severityPercentage >= 30) {
        severityLevel = 'moderate';
    }

    // Additional validations
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (!terms) {
        showNotification('Please accept the Terms of Service', 'error');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = `
        <svg style="width: 20px; height: 20px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 19.07L16.24 16.24M19.07 4.93L16.24 7.76M4.93 19.07L7.76 16.24M4.93 4.93L7.76 7.76" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Creating Account...
    `;
    submitBtn.disabled = true;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    if (!document.querySelector('#spin-animation')) {
        style.id = 'spin-animation';
        document.head.appendChild(style);
    }

    // Simulate API call (replace with actual API call)
    setTimeout(() => {
        // Call actual API
        fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `${firstName} ${lastName}`,
                email,
                password,
                whodasScore,
                severityLevel,
                whodasAnswers: {}
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showNotification(data.error, 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('severityLevel', severityLevel);
            localStorage.setItem('whodasScore', whodasScore);

            showNotification('Account created successfully!', 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        })
        .catch(err => {
            showNotification('Connection error. Please try again.', 'error');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }, 500);
}

// ===== Password Strength Checker =====
function updatePasswordStrength(e) {
    const password = e.target.value;
    const strengthBar = passwordStrength.querySelector('.strength-bar');
    
    if (!strengthBar) return;

    // Calculate password strength
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    // Remove previous classes
    strengthBar.classList.remove('weak', 'medium', 'strong');

    // Apply strength class
    if (password.length === 0) {
        strengthBar.style.width = '0';
    } else if (strength <= 2) {
        strengthBar.classList.add('weak');
    } else if (strength <= 3) {
        strengthBar.classList.add('medium');
    } else {
        strengthBar.classList.add('strong');
    }
}

// ===== Email Validator =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===== Notification Function =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${type === 'error' ? 
                    '<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/><path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' :
                    type === 'success' ?
                    '<path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' :
                    '<path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
                }
            </svg>
            <span>${message}</span>
        </div>
    `;

    // Add styles for notification
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .notification svg {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
        }
        
        .notification-error {
            border-left: 4px solid #f44336;
        }
        
        .notification-error svg {
            color: #f44336;
        }
        
        .notification-success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification-success svg {
            color: #4CAF50;
        }
        
        .notification-info {
            border-left: 4px solid #2196F3;
        }
        
        .notification-info svg {
            color: #2196F3;
        }
        
        .notification-content span {
            color: #333;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .notification {
                top: 1rem;
                right: 1rem;
                left: 1rem;
            }
        }
    `;

    // Append to document
    if (!document.querySelector('#notification-styles')) {
        style.id = 'notification-styles';
        document.head.appendChild(style);
    }
    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// ===== Social Login Handlers =====
const socialButtons = document.querySelectorAll('.btn-social');
socialButtons.forEach(button => {
    button.addEventListener('click', handleSocialLogin);
});

function handleSocialLogin(e) {
    const provider = e.currentTarget.textContent.trim();
    showNotification(`${provider} login coming soon!`, 'info');
}

// ===== Auto-fill remembered email =====
if (loginForm) {
    const rememberedEmail = localStorage.getItem('userEmail');
    if (rememberedEmail) {
        const emailInput = loginForm.querySelector('#email');
        emailInput.value = rememberedEmail;
    }
}

// ===== Smooth Animations on Load =====
window.addEventListener('load', () => {
    document.querySelectorAll('.auth-branding, .auth-form').forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
        }, index * 100);
    });
});
