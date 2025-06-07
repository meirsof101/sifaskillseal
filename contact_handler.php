<?php
// Add these includes at the top
require_once 'phpmailer/src/PHPMailer.php';
require_once 'phpmailer/src/SMTP.php';
require_once 'phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Configuration
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

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__.'/logs/php_errors.log');
error_reporting(E_ALL);

// Set headers once at the top
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

// Validation helper functions
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validatePhone($phone) {
    return preg_match('/^[\+]?[0-9\s\-\(\)]{7,15}$/', $phone);
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Rate limiting (simple file-based)
function checkRateLimit($ip) {
    $rate_file = 'rate_limit/' . md5($ip) . '.txt';
    $max_requests = 5;
    $time_window = 3600;
    
    if (!file_exists('rate_limit')) {
        mkdir('rate_limit', 0755, true);
    }
    
    if (file_exists($rate_file)) {
        $data = json_decode(file_get_contents($rate_file), true);
        $current_time = time();
        
        $data['requests'] = array_filter($data['requests'], function($timestamp) use ($current_time, $time_window) {
            return ($current_time - $timestamp) < $time_window;
        });
        
        if (count($data['requests']) >= $max_requests) {
            return false;
        }
        
        $data['requests'][] = $current_time;
    } else {
        $data = ['requests' => [time()]];
    }
    
    file_put_contents($rate_file, json_encode($data));
    return true;
}

// Log function
function logMessage($message, $type = 'INFO') {
    $log_file = 'logs/contact_form.log';
    if (!file_exists('logs')) {
        mkdir('logs', 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] [$type] $message" . PHP_EOL;
    file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
}

// Main processing
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Only POST requests are allowed');
    }
    
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit($client_ip)) {
        logMessage("Rate limit exceeded for IP: $client_ip", 'WARNING');
        sendResponse(false, 'Too many requests. Please try again later.');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    $required_fields = ['firstName', 'lastName', 'email', 'service', 'message'];
    $errors = [];
    
    foreach ($required_fields as $field) {
        if (empty($input[$field])) {
            $errors[] = ucfirst(str_replace('_', ' ', $field)) . ' is required';
        }
    }
    
    if (!empty($errors)) {
        sendResponse(false, 'Validation errors: ' . implode(', ', $errors));
    }
    
    $data = [
        'firstName' => sanitizeInput($input['firstName']),
        'lastName' => sanitizeInput($input['lastName']),
        'email' => sanitizeInput($input['email']),
        'phone' => sanitizeInput($input['phone'] ?? ''),
        'service' => sanitizeInput($input['service']),
        'orgType' => sanitizeInput($input['orgType'] ?? ''),
        'message' => sanitizeInput($input['message']),
        'contactMethod' => sanitizeInput($input['contactMethod'] ?? 'email'),
        'timestamp' => date('Y-m-d H:i:s'),
        'ip_address' => $client_ip
    ];
    
    if (!validateEmail($data['email'])) {
        sendResponse(false, 'Please provide a valid email address');
    }
    
    if (!empty($data['phone']) && !validatePhone($data['phone'])) {
        sendResponse(false, 'Please provide a valid phone number');
    }
    
    $service_options = [
        'student-training' => 'Student Skills Training',
        'sme-consultancy' => 'SME Consultancy',
        'financial-advisory' => 'Financial Advisory',
        'hr-solutions' => 'HR Solutions',
        'marketing-branding' => 'Marketing & Branding',
        'logistics-trade' => 'Logistics & Trade Facilitation',
        'it-solutions' => 'IT Solutions',
        'agribusiness' => 'Agri-business',
        'general-inquiry' => 'General Inquiry'
    ];
    
    $service_name = $service_options[$data['service']] ?? $data['service'];
    
    $org_types = [
        'individual' => 'Individual',
        'student' => 'Student',
        'startup' => 'Startup',
        'sme' => 'Small/Medium Enterprise',
        'ngo' => 'NGO/Non-Profit',
        'government' => 'Government Agency',
        'educational' => 'Educational Institution',
        'other' => 'Other'
    ];
    
    $org_type_name = $org_types[$data['orgType']] ?? $data['orgType'];
    
    $submission_data = array_merge($data, [
        'service_name' => $service_name,
        'org_type_name' => $org_type_name
    ]);
    
    // Save submission to file
    $submissions_file = 'submissions/contact_submissions.json';
    if (!file_exists('submissions')) {
        mkdir('submissions', 0755, true);
    }
    
    $submissions = [];
    if (file_exists($submissions_file)) {
        $submissions = json_decode(file_get_contents($submissions_file), true) ?? [];
    }
    
    $submissions[] = $submission_data;
    file_put_contents($submissions_file, json_encode($submissions, JSON_PRETTY_PRINT));
    
    // Send email using PHPMailer
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'localhost';
        $mail->SMTPAuth   = false;
        $mail->Port       = 25;
        
        // Recipients  
        $mail->setFrom('noreply@sifaskillseal.com', 'Sifa Skills Contact Form');
        $mail->addAddress('info@sifaskillseal.com');
        $mail->addReplyTo($data['email'], $data['firstName'] . ' ' . $data['lastName']);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = "New Contact Form Submission - $service_name";
        
        // Create HTML email body
        $emailBody = "
        <html>
        <head>
            <title>Contact Form Submission</title>
        </head>
        <body>
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {$data['firstName']} {$data['lastName']}</p>
            <p><strong>Email:</strong> {$data['email']}</p>
            <p><strong>Phone:</strong> {$data['phone']}</p>
            <p><strong>Service:</strong> $service_name</p>
            <p><strong>Organization Type:</strong> $org_type_name</p>
            <p><strong>Preferred Contact Method:</strong> {$data['contactMethod']}</p>
            <p><strong>Message:</strong></p>
            <p>" . nl2br(htmlspecialchars($data['message'])) . "</p>
            <hr>
            <p><em>This message was sent from the contact form on sifaskillseal.com at {$data['timestamp']}</em></p>
        </body>
        </html>
        ";
        
        $mail->Body = $emailBody;
        
        // Alternative plain text body
        $mail->AltBody = "New Contact Form Submission\n\n" .
                         "Name: {$data['firstName']} {$data['lastName']}\n" .
                         "Email: {$data['email']}\n" .
                         "Phone: {$data['phone']}\n" .
                         "Service: $service_name\n" .
                         "Organization Type: $org_type_name\n" .
                         "Message: {$data['message']}\n\n" .
                         "Submitted at: {$data['timestamp']}";
        
        $mail->send();
        
        logMessage("Contact form submitted successfully by {$data['email']} for service: $service_name", 'SUCCESS');
        
        sendResponse(true, 'Message sent successfully! We\'ll get back to you within 24 hours.', [
            'submission_id' => uniqid(),
            'service' => $service_name
        ]);
        
    } catch (Exception $e) {
        logMessage("PHPMailer Error: " . $e->getMessage(), 'ERROR');
        
        // Still send success response to user (email saved to file)
        sendResponse(true, 'Message received! We\'ll get back to you within 24 hours.', [
            'submission_id' => uniqid(),
            'service' => $service_name,
            'note' => 'Email notification pending'
        ]);
    }
    
} catch (Exception $e) {
    logMessage("Error processing contact form: " . $e->getMessage(), 'ERROR');
    sendResponse(false, 'Sorry, there was an error sending your message. Please try again or contact us directly.');
}
?>