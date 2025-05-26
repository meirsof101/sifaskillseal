// This script dynamically loads the navbar and footer HTML into a page.
document.addEventListener("DOMContentLoaded", function () {
    // Load navbar
    fetch("partials/navbar.html")
        .then(res => res.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            // Now that the navbar is in the DOM, attach the event listener
            const menuButton = document.getElementById("mobile-menu-button");
            const mobileMenu = document.getElementById("mobile-menu");

            if (menuButton && mobileMenu) {
                menuButton.addEventListener("click", function () {
                    mobileMenu.classList.toggle("hidden");
                });
            }
        });

    // Load footer
    fetch("partials/footer.html")
        .then(res => res.text())
        .then(data => {
            document.getElementById("footer-placeholder").innerHTML = data;
        });
});