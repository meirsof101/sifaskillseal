// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    setMinDate();
});

let selectedServices = new Map();

function initializeForm() {
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
    
    // Form submission
    document.getElementById('booking-form').addEventListener('submit', handleFormSubmit);
    
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
    const serviceName = serviceCard.querySelector('h4').textContent.trim();
    const serviceDuration = serviceCard.dataset.duration;
    
    if (selectedServices.has(serviceId)) {
        // Remove service
        selectedServices.delete(serviceId);
        serviceCard.classList.remove('selected');
    } else {
        // Add service
        selectedServices.set(serviceId, {
            name: serviceName,
            duration: serviceDuration,
            id: serviceId
        });
        serviceCard.classList.add('selected');
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
                <button class="remove-service-btn" data-service-id="${serviceId}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        selectedServicesList.appendChild(serviceItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-service-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const serviceId = this.getAttribute('data-service-id');
            const serviceCard = document.querySelector(`.service-card[data-service="${serviceId}"]`);
            if (serviceCard) {
                toggleService(serviceCard);
            }
        });
    });
    
    // Update totals
    serviceCount.textContent = selectedServices.size;
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

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (selectedServices.size === 0) {
        alert('Please select at least one service.');
        return;
    }
    
    // Show loading state
    const bookBtn = document.getElementById('book-btn');
    const originalText = bookBtn.textContent;
    bookBtn.textContent = 'Processing Booking...';
    bookBtn.disabled = true;
    
    // Prepare form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        experience: document.getElementById('experience').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        goals: document.getElementById('goals').value,
        services: Array.from(selectedServices.values())
    };
    
    // Set the hidden input value
    document.getElementById('services-data').value = JSON.stringify(Array.from(selectedServices.values()));
    
    // Submit via AJAX
    fetch('booking_handler.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage(data.data.booking_id);
        } else {
            alert(data.message);
            bookBtn.textContent = originalText;
            bookBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was an error submitting your booking. Please try again.');
        bookBtn.textContent = originalText;
        bookBtn.disabled = false;
    });
}

function showSuccessMessage(bookingId) {
    const successMessage = document.getElementById('success-message');
    const bookingForm = document.getElementById('booking-form');
    
    document.getElementById('booking-id').textContent = bookingId;
    successMessage.classList.remove('d-none');
    bookingForm.reset();
    
    // Clear selected services
    selectedServices.clear();
    updateBookingSummary();
    updateBookButton();
    
    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth' });
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