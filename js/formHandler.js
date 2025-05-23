//to handle contact form
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  const response = document.getElementById("formResponse");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    fetch("php/sendEmail.php", {
      method: "POST",
      body: formData,
    })
      .then(res => res.text())
      .then(data => {
        response.textContent = data;
        form.reset();
      })
      .catch(err => {
        response.textContent = "Error sending message.";
        console.error("Form Error:", err);
      });
  });
});
