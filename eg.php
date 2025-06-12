<?php
// Include the same PHPMailer files as your contact form
require_once 'phpmailer/src/PHPMailer.php';
require_once 'phpmailer/src/SMTP.php';
require_once 'phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Configuration - use same as contact form
$config = [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_username' => 'fidelmwaro@gmail.com',
    'smtp_password' => 'kncuzooctugbejvk',
    'from_email' => 'info@sifaskillseal.com',
    'from_name' => 'SifaSkills (EA) Ltd',
    'to_email' => 'info@sifaskillseal.com',
    'cc_email' => '',
    'admin_notification' => true,
    'auto_reply' => true
];

// Error handling
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__.'/logs/php_errors.log');
error_reporting(E_ALL);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Response helper function
function sendResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// Main processing
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Only POST requests are allowed');
    }

    // Get form data
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    // Validate required fields
    $required_fields = ['name', 'email', 'date', 'time', 'services'];
    $errors = [];
    
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            $errors[] = ucfirst($field) . ' is required';
        }
    }
    
    if (!empty($errors)) {
        sendResponse(false, 'Validation errors: ' . implode(', ', $errors));
    }

    // Prepare data
    $booking_data = [
        'name' => htmlspecialchars($input['name']),
        'email' => htmlspecialchars($input['email']),
        'phone' => htmlspecialchars($input['phone'] ?? ''),
        'experience' => htmlspecialchars($input['experience'] ?? ''),
        'date' => htmlspecialchars($input['date']),
        'time' => htmlspecialchars($input['time']),
        'goals' => htmlspecialchars($input['goals'] ?? ''),
        'services' => json_decode($input['services'], true),
        'timestamp' => date('Y-m-d H:i:s'),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];

    // Save to submissions file
    $submissions_file = 'submissions/booking_submissions.json';
    if (!file_exists('submissions')) {
        mkdir('submissions', 0755, true);
    }
    
    $submissions = [];
    if (file_exists($submissions_file)) {
        $submissions = json_decode(file_get_contents($submissions_file), true) ?? [];
    }
    
    $submissions[] = $booking_data;
    file_put_contents($submissions_file, json_encode($submissions, JSON_PRETTY_PRINT));

    // Send email notification
    $mail = new PHPMailer(true);
    
    try {
            $mail->isSMTP();
            $mail->Host       = $config['smtp_host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $config['smtp_username'];
            $mail->Password   = $config['smtp_password'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $config['smtp_port'];

            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addAddress($config['to_email']);

        // Build services list
        $services_list = '';
        foreach ($booking_data['services'] as $service) {
            $services_list .= "<li>{$service['name']} ({$service['duration']} mins)</li>";
        }
        
        $emailBody = "
        <html>
        <head>
            <title>New Booking</title>
        </head>
        <body>
            <h2>New Booking Received</h2>
            <p><strong>Client:</strong> {$booking_data['name']}</p>
            <p><strong>Email:</strong> {$booking_data['email']}</p>
            <p><strong>Phone:</strong> {$booking_data['phone']}</p>
            <p><strong>Experience Level:</strong> {$booking_data['experience']}</p>
            <p><strong>Scheduled For:</strong> {$booking_data['date']} at {$booking_data['time']}</p>
            
            <h3>Selected Services:</h3>
            <ul>{$services_list}</ul>
            
            <p><strong>Client Goals/Questions:</strong></p>
            <p>" . nl2br($booking_data['goals']) . "</p>
            
            <hr>
            <p><em>Booking received at {$booking_data['timestamp']}</em></p>
        </body>
        </html>
        ";
        
        $mail->Body = $emailBody;
        $mail->AltBody = "New Booking\n\nClient: {$booking_data['name']}\nEmail: {$booking_data['email']}\nPhone: {$booking_data['phone']}\n\nServices:\n" . 
                         implode("\n", array_map(function($s) { return "- {$s['name']}"; }, $booking_data['services'])) . 
                         "\n\nScheduled: {$booking_data['date']} at {$booking_data['time']}\n\nGoals: {$booking_data['goals']}";
        
        $mail->send();
        
        sendResponse(true, 'Booking confirmed! You will receive a confirmation email shortly.', [
            'booking_id' => uniqid(),
            'services_count' => count($booking_data['services'])
        ]);
        
    } catch (Exception $e) {
        // Still send success response if email fails (data is saved)
        sendResponse(true, 'Booking received! We will contact you to confirm your sessions.', [
            'booking_id' => uniqid(),
            'note' => 'Email notification pending'
        ]);
    }
    
} catch (Exception $e) {
    sendResponse(false, 'Sorry, there was an error processing your booking. Please try again or contact us directly.');
}
?>