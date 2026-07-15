<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../api/utils.php';

class UtilsTest extends TestCase {
    /**
     * @runInSeparateProcess
     */
    public function testJsonResponse() {
        ob_start();
        jsonResponse(['test' => 'data'], 200, false);
        $output = ob_get_clean();

        $this->assertJson($output);
        $decoded = json_decode($output, true);
        $this->assertEquals(true, $decoded['success']);
        $this->assertEquals(['test' => 'data'], $decoded['data']);
    }

    /**
     * @runInSeparateProcess
     */
    public function testJsonError() {
        ob_start();
        jsonError('Test error', 400, false);
        $output = ob_get_clean();

        $this->assertJson($output);
        $decoded = json_decode($output, true);
        $this->assertEquals(false, $decoded['success']);
        $this->assertEquals('Test error', $decoded['error']);
    }
}
