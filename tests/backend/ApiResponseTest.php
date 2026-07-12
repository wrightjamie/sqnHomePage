<?php
// Define the constant so utils.php doesn't exit
define('PHPUNIT_RUNNING', true);

// Mocks for PHP built-in functions
$GLOBALS['http_response_code'] = null;
$GLOBALS['header_calls'] = [];

// Redefine functions in the global namespace before anything else
if (!function_exists('http_response_code')) {
    function http_response_code($code = null) {
        if ($code !== null) {
            $GLOBALS['http_response_code'] = $code;
        }
        return $GLOBALS['http_response_code'];
    }
}

if (!function_exists('header')) {
    function header($header) {
        $GLOBALS['header_calls'][] = $header;
    }
}

use PHPUnit\Framework\TestCase;

class ApiResponseTest extends TestCase
{
    /**
     * @runInSeparateProcess
     */
    public function testJsonResponse()
    {
        require_once __DIR__ . '/../../api/utils.php';

        ob_start();
        jsonResponse('test_data', 200);
        $output = ob_get_clean();

        $expected = json_encode(['success' => true, 'data' => 'test_data']);
        $this->assertEquals($expected, $output);
    }

    /**
     * @runInSeparateProcess
     */
    public function testJsonError()
    {
        require_once __DIR__ . '/../../api/utils.php';

        ob_start();
        jsonError('Not found', 404);
        $output = ob_get_clean();

        $expected = json_encode(['success' => false, 'error' => 'Not found']);
        $this->assertEquals($expected, $output);
    }
}
