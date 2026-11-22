<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../api/programme_helpers.php';

class ProgrammeRenameTest extends TestCase {
    private PDO $pdo;

    protected function setUp(): void {
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->exec("CREATE TABLE settings (`key` TEXT PRIMARY KEY, `value` TEXT)");

        // Non-month keys that must never be touched
        $this->insertSetting('programme_config', json_encode([
            'uniforms' => [['name' => 'Dark Blue', 'color' => '#002F5F']],
            'staff' => [['name' => 'Drew', 'rank' => 'FSgt']],
        ]));
        $this->insertSetting('programme_autocomplete_cache', json_encode([
            'activities' => [['name' => 'Blue Radio', 'count' => 3]],
            'comments' => [],
        ]));

        // Past & current/future month data relative to reference date 2026-07-15
        $this->insertSetting('programme_2026_7', json_encode([
            'parade_nights' => [
                [
                    'date' => '2026-07-13', // past
                    'uniform' => 'Light Blue',
                    'duty_nco' => 'Sgt Sheffield',
                    'duty_cadet' => 'Bloggs',
                    'notes' => [],
                    'activities' => [
                        [
                            'classifications' => ['Junior', 'First Class'],
                            'activity_type' => 'Academic',
                            'name' => 'Blue Radio',
                            'instructor' => 'FSgt Drew',
                        ],
                    ],
                ],
                [
                    'date' => '2026-07-15', // today (inclusive)
                    'uniform' => 'Light Blue',
                    'duty_nco' => 'Sgt Sheffield',
                    'duty_cadet' => 'Jones',
                    'notes' => [],
                    'activities' => [
                        [
                            'classifications' => ['Junior'],
                            'activity_type' => 'Academic',
                            'name' => 'Drill',
                            'instructor' => 'FSgt Drew',
                        ],
                        [
                            'classifications' => ['First Class', 'Leading'],
                            'activity_type' => 'Outdoor',
                            'name' => 'Fieldcraft',
                            'instructor' => 'FSgt Drew',
                        ],
                    ],
                ],
            ],
            'month_comments' => [],
        ]));

        $this->insertSetting('programme_2026_8', json_encode([
            'parade_nights' => [
                [
                    'date' => '2026-08-03', // future month
                    'uniform' => 'Light Blue',
                    'duty_nco' => 'Sgt Sheffield',
                    'duty_cadet' => '',
                    'notes' => [],
                    'activities' => [
                        [
                            'classifications' => ['First Class'],
                            'activity_type' => 'Academic',
                            'name' => 'Navigation',
                            'instructor' => 'WO Wright',
                        ],
                    ],
                ],
            ],
            'month_comments' => [],
        ]));
    }

    private function insertSetting(string $key, string $value): void {
        $stmt = $this->pdo->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?)");
        $stmt->execute([$key, $value]);
    }

    private function getMonth(string $key): array {
        $stmt = $this->pdo->prepare("SELECT `value` FROM settings WHERE `key` = ?");
        $stmt->execute([$key]);
        return json_decode((string)$stmt->fetchColumn(), true);
    }

    public function testFormatPersonnelName(): void {
        $this->assertSame('FS Sheffield', formatPersonnelName(' FS ', ' Sheffield '));
        $this->assertSame('Smith', formatPersonnelName('', 'Smith'));
        $this->assertSame('Sgt', formatPersonnelName('Sgt', ''));
    }

    public function testValidRenameTypes(): void {
        foreach (['nco', 'staff', 'uniform', 'activity_type', 'classification'] as $type) {
            $this->assertTrue(isValidProgrammeRenameType($type));
        }
        $this->assertFalse(isValidProgrammeRenameType('unknown'));
    }

    public function testDryRunPreviewCountsOnlyUpcomingNightsWithoutMutating(): void {
        $result = propagateProgrammeRename($this->pdo, 'nco', 'Sgt Sheffield', 'FS Sheffield', false, '2026-07-15');

        $this->assertSame(2, $result['matching_nights']);
        $this->assertSame(2, $result['matching_occurrences']);
        $this->assertSame(0, $result['updated_months']);
        $this->assertSame('2026-07-15', $result['from_date']);

        $july = $this->getMonth('programme_2026_7');
        $this->assertSame('Sgt Sheffield', $july['parade_nights'][1]['duty_nco']);
    }

    public function testPromoteNcoUpdatesUpcomingNightsAndPreservesPastHistory(): void {
        $result = propagateProgrammeRename($this->pdo, 'nco', 'Sgt Sheffield', 'FS Sheffield', true, '2026-07-15');

        $this->assertSame(2, $result['matching_nights']);
        $this->assertSame(2, $result['updated_months']);

        $july = $this->getMonth('programme_2026_7');
        $august = $this->getMonth('programme_2026_8');

        // Past night preserved
        $this->assertSame('Sgt Sheffield', $july['parade_nights'][0]['duty_nco']);
        // Today & future updated
        $this->assertSame('FS Sheffield', $july['parade_nights'][1]['duty_nco']);
        $this->assertSame('FS Sheffield', $august['parade_nights'][0]['duty_nco']);
    }

    public function testPromoteStaffUpdatesMultipleActivitiesOnUpcomingNights(): void {
        $result = propagateProgrammeRename($this->pdo, 'staff', 'FSgt Drew', 'WO Drew', true, '2026-07-15');

        $this->assertSame(1, $result['matching_nights']);
        $this->assertSame(2, $result['matching_occurrences']);
        $this->assertSame(1, $result['updated_months']);

        $july = $this->getMonth('programme_2026_7');
        // Past preserved
        $this->assertSame('FSgt Drew', $july['parade_nights'][0]['activities'][0]['instructor']);
        // Today both activities updated
        $this->assertSame('WO Drew', $july['parade_nights'][1]['activities'][0]['instructor']);
        $this->assertSame('WO Drew', $july['parade_nights'][1]['activities'][1]['instructor']);
    }

    public function testRenameUniformUpdatesUpcomingNightsOnly(): void {
        $result = propagateProgrammeRename($this->pdo, 'uniform', 'Light Blue', 'No. 2 Working Blue', true, '2026-07-15');

        $this->assertSame(2, $result['matching_nights']);
        $this->assertSame(2, $result['updated_months']);

        $july = $this->getMonth('programme_2026_7');
        $august = $this->getMonth('programme_2026_8');
        $this->assertSame('Light Blue', $july['parade_nights'][0]['uniform']);
        $this->assertSame('No. 2 Working Blue', $july['parade_nights'][1]['uniform']);
        $this->assertSame('No. 2 Working Blue', $august['parade_nights'][0]['uniform']);
    }

    public function testRenameActivityTypeUpdatesUpcomingNightsOnly(): void {
        $result = propagateProgrammeRename($this->pdo, 'activity_type', 'Academic', 'Classroom', true, '2026-07-15');

        $this->assertSame(2, $result['matching_nights']);
        $this->assertSame(2, $result['updated_months']);

        $july = $this->getMonth('programme_2026_7');
        $august = $this->getMonth('programme_2026_8');
        $this->assertSame('Academic', $july['parade_nights'][0]['activities'][0]['activity_type']);
        $this->assertSame('Classroom', $july['parade_nights'][1]['activities'][0]['activity_type']);
        $this->assertSame('Outdoor', $july['parade_nights'][1]['activities'][1]['activity_type']);
        $this->assertSame('Classroom', $august['parade_nights'][0]['activities'][0]['activity_type']);
    }

    public function testRenameClassificationUpdatesMergedAndSingleCellsOnUpcomingNightsOnly(): void {
        $result = propagateProgrammeRename($this->pdo, 'classification', 'First Class', '1st Class', true, '2026-07-15');

        $this->assertSame(2, $result['matching_nights']);
        $this->assertSame(2, $result['matching_occurrences']);

        $july = $this->getMonth('programme_2026_7');
        $august = $this->getMonth('programme_2026_8');

        // Past preserved
        $this->assertSame(['Junior', 'First Class'], $july['parade_nights'][0]['activities'][0]['classifications']);
        // Today merged cell updated cleanly
        $this->assertSame(['1st Class', 'Leading'], $july['parade_nights'][1]['activities'][1]['classifications']);
        // Future updated
        $this->assertSame(['1st Class'], $august['parade_nights'][0]['activities'][0]['classifications']);
    }

    public function testWorksInsideExistingTransaction(): void {
        $this->pdo->beginTransaction();
        $result = propagateProgrammeRename($this->pdo, 'nco', 'Sgt Sheffield', 'CWO Sheffield', true, '2026-07-15');
        $this->pdo->commit();

        $this->assertSame(2, $result['matching_nights']);
        $august = $this->getMonth('programme_2026_8');
        $this->assertSame('CWO Sheffield', $august['parade_nights'][0]['duty_nco']);
    }

    public function testInvalidTypeThrowsException(): void {
        $this->expectException(InvalidArgumentException::class);
        propagateProgrammeRename($this->pdo, 'invalid_type', 'A', 'B', false, '2026-07-15');
    }
}
