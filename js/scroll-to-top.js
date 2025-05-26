// Scroll to Top Button Functionality
document.addEventListener('DOMContentLoaded', function() {
    const scrollToTopButton = document.getElementById('scrollToTop');
    
    if (!scrollToTopButton) {
        console.warn('Scroll to top button not found');
        return;
    }

    // Show/hide button based on scroll position
    function toggleScrollButton() {
        if (window.pageYOffset > 300) {
            scrollToTopButton.classList.remove('opacity-0', 'invisible');
            scrollToTopButton.classList.add('opacity-100');
        } else {
            scrollToTopButton.classList.add('opacity-0', 'invisible');
            scrollToTopButton.classList.remove('opacity-100');
        }
    }

    // Scroll to top function
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Event listeners
    window.addEventListener('scroll', toggleScrollButton);
    scrollToTopButton.addEventListener('click', scrollToTop);
    
    // Initial check on page load
    toggleScrollButton();
});