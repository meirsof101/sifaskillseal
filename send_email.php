<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize inputs
    function clean_input($data) {
        return htmlspecialchars(stripslashes(trim($data)));
    }

    $firstName = clean_input($_POST["firstName"] ?? '');
    $lastName = clean_input($_POST["lastName"] ?? '');
    $email = clean_input($_POST["email"] ?? '');
    $phone = clean_input($_POST["phone"] ?? '');
    $service = clean_input($_POST["service"] ?? '');
    $orgType = clean_input($_POST["orgType"] ?? '');
    $message = clean_input($_POST["message"] ?? '');
    $contactMethod = clean_input($_POST["contactMethod"] ?? '');

    // Validate required fields
    if (!$firstName || !$lastName || !$email || !$service || !$message) {
        echo "Please fill in all required fields.";
        exit;
    }

    $to = "your-email@example.com"; // Change this to your destination email
    $subject = "New Contact Form Submission";

    $body = "
    You have received a new inquiry from your website contact form:

    Name: $firstName $lastName
    Email: $email
    Phone: $phone
    Service Interest: $service
    Organization Type: $orgType
    Preferred Contact Method: $contactMethod

    Message:
    $message
    ";

    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";

    if (mail($to, $subject, $body, $headers)) {
        echo "Thank you for your message, $firstName. We'll get back to you shortly.";
    } else {
        echo "There was a problem sending your message. Please try again later.";
    }
} else {
    echo "Invalid request.";
}
?>
