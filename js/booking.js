// Service Selection and Booking Form JavaScript
let selectedServices = new Map();
let totalPrice = 0;

// Initialize the booking form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setMinDate();
});

function initializeForm() {
    const bookBtn = document.getElementById('book-btn');
    const bookingSummary = document.getElementById('booking-summary');
    
    updateBookingSummary();
    updateBookButton();
}

function setupEventListeners() {
    // Service card click handlers
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            toggleService(this);
        });
    });
    
    // Select All button
    document.getElementById('selectAllBtn').addEventListener('click', selectAllServices);
    
    // Clear All button
    document.getElementById('clearAllBtn').addEventListener('click', clearAllServices);
    
    // Book button
    document.getElementById('book-btn').addEventListener('click', handleBooking);
    
    // Scroll to top button
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        scrollBtn.addEventListener('click', scrollToTop);
        window.addEventListener('scroll', toggleScrollButton);
    }
    
    // Form validation
    const requiredFields = ['name', 'email', 'date', 'time'];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', updateBookButton);
            field.addEventListener('change', updateBookButton);
        }
    });
}

function setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }
}

function toggleService(serviceCard) {
    const serviceId = serviceCard.dataset.service;
    const serviceName = serviceCard.querySelector('h4').textContent;
    const servicePrice = parseInt(serviceCard.dataset.price) || 0;
    const serviceDuration = serviceCard.dataset.duration;
    
    if (selectedServices.has(serviceId)) {
        // Remove service
        selectedServices.delete(serviceId);
        serviceCard.classList.remove('selected');
        totalPrice -= servicePrice;
    } else {
        // Add service
        selectedServices.set(serviceId, {
            name: serviceName,
            price: servicePrice,
            duration: serviceDuration
        });
        serviceCard.classList.add('selected');
        totalPrice += servicePrice;
    }
    
    updateBookingSummary();
    updateBookButton();
}

function selectAllServices() {
    document.querySelectorAll('.service-card').forEach(card => {
        const serviceId = card.dataset.service;
        if (!selectedServices.has(serviceId)) {
            toggleService(card);
        }
    });
}

function clearAllServices() {
    document.querySelectorAll('.service-card').forEach(card => {
        const serviceId = card.dataset.service;
        if (selectedServices.has(serviceId)) {
            toggleService(card);
        }
    });
}

function updateBookingSummary() {
    const bookingSummary = document.getElementById('booking-summary');
    const selectedServicesList = document.getElementById('selected-services-list');
    const serviceCount = document.getElementById('service-count');
    
    if (selectedServices.size === 0) {
        bookingSummary.classList.add('d-none');
        return;
    }
    
    bookingSummary.classList.remove('d-none');
    
    // Update services list
    selectedServicesList.innerHTML = '';
    selectedServices.forEach((service, serviceId) => {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'selected-service-item';
        serviceItem.innerHTML = `
            <div>
                <strong>${service.name}</strong><br>
                <small class="text-muted">${service.duration} minutes</small>
            </div>
            <div class="text-end">
                ${service.price > 0 ? `<div class="fw-bold" style="color: var(--orange-flame);">$${service.price}</div>` : ''}
                <button class="remove-service-btn" onclick="removeService('${serviceId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        selectedServicesList.appendChild(serviceItem);
    });
    
    // Update totals
    serviceCount.textContent = selectedServices.size;
}

function removeService(serviceId) {
    const serviceCard = document.querySelector(`[data-service="${serviceId}"]`);
    if (serviceCard) {
        toggleService(serviceCard);
    }
}

function updateBookButton() {
    const bookBtn = document.getElementById('book-btn');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    
    const hasSelectedServices = selectedServices.size > 0;
    const hasRequiredFields = name && email && date && time;
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (hasSelectedServices && hasRequiredFields && isValidEmail) {
        bookBtn.disabled = false;
        bookBtn.classList.remove('btn-disabled');
        bookBtn.textContent = `Book ${selectedServices.size} Service${selectedServices.size > 1 ? 's' : ''}`;
    } else {
        bookBtn.disabled = true;
        bookBtn.classList.add('btn-disabled');
        if (!hasSelectedServices) {
            bookBtn.textContent = 'Select Services to Continue';
        } else if (!hasRequiredFields) {
            bookBtn.textContent = 'Please Fill Required Fields';
        } else if (!isValidEmail) {
            bookBtn.textContent = 'Please Enter Valid Email';
        }
    }
}

async function handleBooking() {
    if (selectedServices.size === 0) {
        alert('Please select at least one service.');
        return;
    }
    
    // Validate required fields
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    
    if (!name || !email || !date || !time) {
        alert('Please fill in all required fields.');
        return;
    }
    
    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Show loading state
    const bookBtn = document.getElementById('book-btn');
    const originalText = bookBtn.textContent;
    bookBtn.textContent = 'Processing Booking...';
    bookBtn.disabled = true;
    
    try {
        // Prepare booking data
        const bookingData = {
            name: name,
            email: email,
            phone: document.getElementById('phone').value.trim(),
            experience: document.getElementById('experience').value,
            date: date,
            time: time,
            goals: document.getElementById('goals').value.trim(),
            services: Array.from(selectedServices.entries()).map(([id, service]) => ({
                id: id,
                name: service.name,
                duration: service.duration,
                price: service.price
            })),
            totalServices: selectedServices.size,
            totalPrice: totalPrice,
            bookingId: generateBookingId()
        };
        
        // Send booking request
        const response = await fetch('booking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage(bookingData.bookingId);
            scrollToElement(document.getElementById('success-message'));
        } else {
            throw new Error(result.message || 'Booking failed');
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Sorry, there was an error processing your booking. Please try again or contact us directly.');
        
        // Restore button state
        bookBtn.textContent = originalText;
        bookBtn.disabled = false;
    }
}

function showSuccessMessage(bookingId) {
    const successMessage = document.getElementById('success-message');
    
    document.getElementById('booking-id').textContent = bookingId;
    successMessage.classList.remove('d-none');
    
    // Hide form sections
    document.querySelector('.glass-effect .section-header').style.display = 'none';
    document.getElementById('booking-summary').style.display = 'none';
    document.querySelectorAll('.mb-3, .mb-4, .row.mb-3').forEach(el => el.style.display = 'none');
    document.getElementById('book-btn').style.display = 'none';
}

function generateBookingId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `SF-${timestamp}-${randomStr}`.toUpperCase();
}

function scrollToElement(element) {
    element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function toggleScrollButton() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    }
}

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return phone === '' || re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Enhanced form validation
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !validateEmail(this.value)) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            if (this.value && !validatePhone(this.value)) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }
});

// Add pulse effect to selected services
function addPulseEffect() {
    document.querySelectorAll('.service-card.selected').forEach(card => {
        card.classList.add('pulse-glow');
        setTimeout(() => {
            card.classList.remove('pulse-glow');
        }, 2000);
    });
}