
        //load navbar and footer script
        document.addEventListener("DOMContentLoaded", function () {
            fetch("partials/navbar.html")
                .then(res => res.text())
                .then(data => {
                document.getElementById("navbar-placeholder").innerHTML = data;
                });

            fetch("partials/footer.html")
                .then(res => res.text())
                .then(data => {
                document.getElementById("footer-placeholder").innerHTML = data;
                });
            });

        //end of load navbar and footer script



