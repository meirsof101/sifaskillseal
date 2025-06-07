
// Form Handler for SifaSkills Contact Form
// This script handles the contact form submission, validation, and user feedback.
// Contact Form Handler
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get submit button and disable it
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Sending...';
    
    // Get form data
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        service: document.getElementById('service').value,
        orgType: document.getElementById('orgType').value,
        message: document.getElementById('message').value.trim(),
        contactMethod: document.querySelector('input[name="contactMethod"]:checked').value
    };
    
    // Client-side validation
    const errors = [];
    
    if (!formData.firstName) errors.push('First name is required');
    if (!formData.lastName) errors.push('Last name is required');
    if (!formData.email) errors.push('Email is required');
    if (!formData.service) errors.push('Service selection is required');
    if (!formData.message) errors.push('Message is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Phone validation (if provided)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
        errors.push('Please enter a valid phone number');
    }
    
    if (errors.length > 0) {
        showErrorMessage(errors.join('<br>'));
        resetSubmitButton();
        return;
    }
    
    function resetSubmitButton() {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
    
    try {
        // Send data to PHP handler
        const response = await fetch('contact_handler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success popup
            showSuccessPopup(result.message);
            
            // Reset form
            this.reset();
            
            // Optional: Track successful submission (Google Analytics, etc.)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    event_category: 'Contact',
                    event_label: formData.service
                });
            }
        } else {
            // Show error message
            showErrorMessage(result.message);
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage('Sorry, there was a network error. Please check your connection and try again.');
    } finally {
        resetSubmitButton();
    }
});

// Enhanced success popup function
function showSuccessPopup(message = null) {
    const popup = document.getElementById('successPopup');
    
    // Update message if provided
    if (message) {
        const messageElement = popup.querySelector('.popup-message');
        messageElement.textContent = message;
    }
    
    popup.classList.add('show');
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        closeSuccessPopup();
    }, 5000);
}

function closeSuccessPopup() {
    const popup = document.getElementById('successPopup');
    popup.classList.remove('show');
}

// Error message display function
function showErrorMessage(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.error-alert');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger error-alert mt-3';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error:</strong> ${message}
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    
    // Insert after form
    const form = document.getElementById('contactForm');
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    
    // Scroll to error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 8000);
}

// Form field validation on blur
document.addEventListener('DOMContentLoaded', function() {
    const formFields = ['firstName', 'lastName', 'email', 'phone', 'message'];
    
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                validateField(this);
            });
            
            field.addEventListener('input', function() {
                // Remove validation styling on input
                this.classList.remove('is-valid', 'is-invalid');
                const feedback = this.parentNode.querySelector('.invalid-feedback');
                if (feedback) feedback.remove();
            });
        }
    });
});

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Remove existing feedback
    field.classList.remove('is-valid', 'is-invalid');
    const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
    if (existingFeedback) existingFeedback.remove();
    
    switch (field.id) {
        case 'firstName':
        case 'lastName':
            if (!value) {
                isValid = false;
                errorMessage = 'This field is required';
            } else if (value.length < 2) {
                isValid = false;
                errorMessage = 'Must be at least 2 characters';
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                isValid = false;
                errorMessage = 'Email is required';
            } else if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'phone':
            if (value) { // Only validate if phone is provided
                const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
                if (!phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
            }
            break;
            
        case 'message':
            if (!value) {
                isValid = false;
                errorMessage = 'Message is required';
            } else if (value.length < 10) {
                isValid = false;
                errorMessage = 'Message must be at least 10 characters';
            }
            break;
    }
    
    // Apply validation styling
    if (isValid) {
        field.classList.add('is-valid');
    } else {
        field.classList.add('is-invalid');
        
        // Add error message
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = 'invalid-feedback';
        feedbackDiv.textContent = errorMessage;
        field.parentNode.appendChild(feedbackDiv);
    }
    
    return isValid;
}

// Close popup when clicking outside
document.getElementById('successPopup').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSuccessPopup();
    }
});

// Close popup with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSuccessPopup();
    }
});

// Scroll to top functionality
window.addEventListener('scroll', function() {
    const scrollButton = document.getElementById('scrollToTop');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('show');
    } else {
        scrollButton.classList.remove('show');
    }
});

document.getElementById('scrollToTop').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Auto-save form data to localStorage (optional)
function autoSaveForm() {
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        orgType: document.getElementById('orgType').value,
        message: document.getElementById('message').value
    };
    
    localStorage.setItem('sifaskills_contact_draft', JSON.stringify(formData));
}

// Load saved form data on page load
window.addEventListener('load', function() {
    const savedData = localStorage.getItem('sifaskills_contact_draft');
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            Object.keys(formData).forEach(key => {
                const field = document.getElementById(key);
                if (field && formData[key]) {
                    field.value = formData[key];
                }
            });
        } catch (e) {
            console.log('Error loading saved form data:', e);
        }
    }
});

// Auto-save on form input (debounced)
let autoSaveTimeout;
document.getElementById('contactForm').addEventListener('input', function() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(autoSaveForm, 1000); // Save after 1 second of inactivity
});

// Clear saved data after successful submission
function clearSavedFormData() {
    localStorage.removeItem('sifaskills_contact_draft');
}