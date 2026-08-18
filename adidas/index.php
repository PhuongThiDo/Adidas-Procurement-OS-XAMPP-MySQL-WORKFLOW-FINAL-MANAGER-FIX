<?php
/**
 * Adidas Procurement OS - Apache / PHP Entry Point & Reverse Proxy
 * 
 * Lưu ý quan trọng: Hệ thống là ứng dụng Full-Stack (Node.js/Express + React Vite).
 * Cách chạy chuẩn nhất:
 *   1. npm install
 *   2. npm run build
 *   3. npm start
 *   -> Truy cập trực tiếp: http://localhost:3000
 * 
 * Nếu chạy qua Apache/XAMPP:
 *   File index.php này sẽ tự động proxy các request /api/* sang Node.js Express (port 3000).
 */

$request_uri = $_SERVER['REQUEST_URI'];
$parsed_path = parse_url($request_uri, PHP_URL_PATH);

// 1. Proxy API requests to Node.js Backend (port 3000)
if (str_contains($parsed_path, '/api/')) {
    $api_path_pos = strpos($parsed_path, '/api/');
    $relative_api_path = substr($parsed_path, $api_path_pos);
    $query = $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '';
    $node_backend_url = 'http://127.0.0.1:3000' . $relative_api_path . $query;

    $ch = curl_init($node_backend_url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    // Forward Headers
    $headers = [];
    foreach (getallheaders() as $key => $val) {
        if (!in_array(strtolower($key), ['host', 'content-length'])) {
            $headers[] = "$key: $val";
        }
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // Forward Body
    $body = file_get_contents('php://input');
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);

    if ($response === false) {
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'BAD_GATEWAY_NODE_SERVER_NOT_FOUND',
            'message' => 'Node.js Express Backend is not running on port 3000. Please execute "npm start" or "npm run dev" in terminal.',
            'target_url' => $node_backend_url
        ]);
        curl_close($ch);
        exit;
    }

    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $res_headers = substr($response, 0, $header_size);
    $res_body = substr($response, $header_size);
    curl_close($ch);

    http_response_code($http_code);
    foreach (explode("\r\n", $res_headers) as $h) {
        if (!empty($h) && !str_starts_with(strtolower($h), 'transfer-encoding:')) {
            header($h);
        }
    }
    echo $res_body;
    exit;
}

// 2. Serve Static Frontend SPA
if (file_exists(__DIR__ . '/dist/index.html')) {
    $path = __DIR__ . '/dist' . $parsed_path;
    if ($request_uri !== '/' && file_exists($path) && !is_dir($path)) {
        $mime = 'application/octet-stream';
        if (str_ends_with($path, '.css')) $mime = 'text/css';
        else if (str_ends_with($path, '.js')) $mime = 'application/javascript';
        else if (str_ends_with($path, '.json')) $mime = 'application/json';
        else if (str_ends_with($path, '.svg')) $mime = 'image/svg+xml';
        else if (str_ends_with($path, '.png')) $mime = 'image/png';
        else if (str_ends_with($path, '.jpg') || str_ends_with($path, '.jpeg')) $mime = 'image/jpeg';
        else if (function_exists('mime_content_type')) $mime = mime_content_type($path);
        
        header("Content-Type: $mime");
        readfile($path);
        exit;
    }
    include __DIR__ . '/dist/index.html';
    exit;
} else if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
    exit;
} else {
    echo "<h1>Adidas Procurement OS</h1>";
    echo "<p>Please build the application first: <code>npm install && npm run build && npm start</code></p>";
    echo "<p>Then access directly at: <a href='http://localhost:3000'>http://localhost:3000</a></p>";
}
