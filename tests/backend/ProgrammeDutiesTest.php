<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../api/programme_helpers.php';

class ProgrammeDutiesTest extends TestCase {
    private array $config;

    protected function setUp(): void {
        $this->config = [
            'parade_nights' => ['Monday', 'Thursday'],
            'classifications' => ['Junior', 'First Class', 'Leading', 'Senior / Master'],
        ];
    }

    public function testGetParadeDatesForMonthGeneratesExpectedDates(): void {
        // December 2026: Mondays = 7, 14, 21, 28; Thursdays = 3, 10, 17, 24, 31
        $dates = getParadeDatesForMonth(2026, 12, ['Monday', 'Thursday']);
        $this->assertSame([
            '2026-12-03',
            '2026-12-07',
            '2026-12-10',
            '2026-12-14',
            '2026-12-17',
            '2026-12-21',
            '2026-12-24',
            '2026-12-28',
            '2026-12-31',
        ], $dates);
    }

    public function testDutiesOnlyCreatesNewMonthSkeletonWithOnlyDutyFields(): void {
        $incoming = [
            'parade_nights' => [
                [
                    'date' => '2026-12-03',
                    'uniform' => 'Greens', // must be ignored
                    'notes' => ['Unauthorized note'], // must be ignored
                    'activities' => [
                        ['classifications' => ['Junior'], 'activity_type' => 'Outdoor', 'name' => 'Hacked', 'instructor' => 'WO Wright'],
                    ],
                    'duty_nco' => ' FS Sheffield ',
                    'duty_cadet' => ' Bloggs ',
                ],
                [
                    'date' => '2026-12-25', // not a Monday/Thursday, must be ignored
                    'duty_nco' => 'Cpl Smith',
                    'duty_cadet' => 'Jones',
                ],
            ],
            'month_comments' => ['Unauthorized month comment'], // must be ignored
        ];

        $merged = mergeDutiesOnlyProgramme($this->config, null, $incoming, 2026, 12);

        $this->assertSame([], $merged['month_comments']);
        $this->assertSame(9, count($merged['parade_nights']));

        $firstNight = $merged['parade_nights'][0];
        $this->assertSame('2026-12-03', $firstNight['date']);
        $this->assertSame('FS Sheffield', $firstNight['duty_nco']);
        $this->assertSame('Bloggs', $firstNight['duty_cadet']);
        $this->assertSame('', $firstNight['uniform']);
        $this->assertSame([], $firstNight['notes']);
        $this->assertSame(4, count($firstNight['activities']));
        $this->assertSame('', $firstNight['activities'][0]['name']);
        $this->assertSame(['Junior'], $firstNight['activities'][0]['classifications']);

        // Non-parade date must not be added
        $dates = array_column($merged['parade_nights'], 'date');
        $this->assertFalse(in_array('2026-12-25', $dates, true));
    }

    public function testDutiesOnlyPreservesExistingProgrammeDataAndAddsMissingConfiguredDates(): void {
        $existing = [
            'parade_nights' => [
                [
                    'date' => '2026-12-03',
                    'uniform' => 'Light Blue',
                    'notes' => ['Bring water bottle'],
                    'activities' => [
                        ['classifications' => ['Junior', 'First Class'], 'activity_type' => 'Academic', 'name' => 'Radio', 'instructor' => 'WO Wright'],
                    ],
                    'duty_nco' => 'Sgt Sheffield',
                    'duty_cadet' => 'Old Cadet',
                ],
            ],
            'month_comments' => ['Squadron dining-in night on 17th'],
        ];

        $incoming = [
            'parade_nights' => [
                [
                    'date' => '2026-12-03',
                    'uniform' => '', // must NOT overwrite existing uniform
                    'notes' => [], // must NOT overwrite existing notes
                    'activities' => [], // must NOT overwrite existing activities
                    'duty_nco' => 'FS Sheffield',
                    'duty_cadet' => 'New Cadet',
                ],
                [
                    'date' => '2026-12-07', // newly initialized date in same month
                    'duty_nco' => 'Cpl Jones',
                    'duty_cadet' => 'Smith',
                ],
            ],
            'month_comments' => [], // must NOT overwrite existing month comments
        ];

        $merged = mergeDutiesOnlyProgramme($this->config, $existing, $incoming, 2026, 12);

        $this->assertSame(['Squadron dining-in night on 17th'], $merged['month_comments']);
        $this->assertSame(9, count($merged['parade_nights']));

        // Existing night preserved except duty fields
        $night1 = $merged['parade_nights'][0];
        $this->assertSame('2026-12-03', $night1['date']);
        $this->assertSame('Light Blue', $night1['uniform']);
        $this->assertSame(['Bring water bottle'], $night1['notes']);
        $this->assertSame('Radio', $night1['activities'][0]['name']);
        $this->assertSame('FS Sheffield', $night1['duty_nco']);
        $this->assertSame('New Cadet', $night1['duty_cadet']);

        // Newly generated night got its duties
        $night2 = $merged['parade_nights'][1];
        $this->assertSame('2026-12-07', $night2['date']);
        $this->assertSame('Cpl Jones', $night2['duty_nco']);
        $this->assertSame('Smith', $night2['duty_cadet']);
        $this->assertSame('', $night2['uniform']);
    }
}
