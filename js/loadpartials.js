    document.addEventListener("DOMContentLoaded", function () {
    // Load navbar
    fetch("partials/navbar.html")
        .then(res => res.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

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

            // SAFELY attach scroll button logic after footer loads
            const scrollToTopBtn = document.getElementById("scrollToTop");

            if (scrollToTopBtn) {
                window.addEventListener("scroll", () => {
                    if (window.pageYOffset > 300) {
                        scrollToTopBtn.classList.add("show");
                    } else {
                        scrollToTopBtn.classList.remove("show");
                    }
                });

                scrollToTopBtn.addEventListener("click", () => {
                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                });
            }
        });
});
