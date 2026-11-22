<?php
// api/programme_helpers.php

const PROGRAMME_RENAME_TYPES = [
    'nco',
    'staff',
    'uniform',
    'activity_type',
    'classification',
];

/**
 * Formats a personnel rank and name into the display string stored in programmes.
 *
 * @param string $rank The personnel rank (may be empty).
 * @param string $name The personnel name.
 * @return string The formatted display string (e.g. "FS Sheffield").
 */
function formatPersonnelName(string $rank, string $name): string {
    $trimmedRank = trim($rank);
    $trimmedName = trim($name);

    if ($trimmedRank !== '' && $trimmedName !== '') {
        return "{$trimmedRank} {$trimmedName}";
    }

    return $trimmedName !== '' ? $trimmedName : $trimmedRank;
}

/**
 * Checks whether a rename target type is supported for programme propagation.
 *
 * @param string $type Entity type identifier.
 * @return bool True if supported.
 */
function isValidProgrammeRenameType(string $type): bool {
    return in_array($type, PROGRAMME_RENAME_TYPES, true);
}

/**
 * Counts or applies a rename across upcoming/future parade nights (from $fromDate onwards).
 *
 * Past parade nights strictly before $fromDate are never modified so historical records stay intact.
 *
 * @param PDO         $pdo      Active SQLite PDO connection.
 * @param string      $type     One of PROGRAMME_RENAME_TYPES ('nco', 'staff', 'uniform', 'activity_type', 'classification').
 * @param string      $oldValue Previous display string or item name to match exactly.
 * @param string      $newValue Replacement display string or item name.
 * @param bool        $apply    When false, performs a dry-run preview without writing to the database.
 * @param string|null $fromDate Inclusive ISO date (YYYY-MM-DD) threshold; defaults to today.
 * @return array{matching_nights: int, matching_occurrences: int, updated_months: int, from_date: string}
 * @throws InvalidArgumentException If $type is not supported.
 */
function propagateProgrammeRename(
    PDO $pdo,
    string $type,
    string $oldValue,
    string $newValue,
    bool $apply = false,
    ?string $fromDate = null
): array {
    if (!isValidProgrammeRenameType($type)) {
        throw new InvalidArgumentException("Unsupported programme rename type: {$type}");
    }

    $oldValue = trim($oldValue);
    $newValue = trim($newValue);
    $effectiveDate = $fromDate ?? date('Y-m-d');

    if ($oldValue === '' || ($apply && ($newValue === '' || $oldValue === $newValue))) {
        return [
            'matching_nights' => 0,
            'matching_occurrences' => 0,
            'updated_months' => 0,
            'from_date' => $effectiveDate,
        ];
    }

    $stmt = $pdo->query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'programme_%'");
    $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    $matchingNights = 0;
    $matchingOccurrences = 0;
    $pendingUpdates = [];

    foreach ($rows as $row) {
        $key = (string)($row['key'] ?? '');
        if (!preg_match('/^programme_(\d{4})_(\d{1,2})$/', $key)) {
            continue;
        }

        $monthData = json_decode((string)($row['value'] ?? ''), true);
        if (!is_array($monthData) || empty($monthData['parade_nights']) || !is_array($monthData['parade_nights'])) {
            continue;
        }

        $monthChanged = false;

        foreach ($monthData['parade_nights'] as &$night) {
            if (!is_array($night) || empty($night['date']) || !is_string($night['date'])) {
                continue;
            }

            if ($night['date'] < $effectiveDate) {
                continue;
            }

            $nightMatches = 0;

            switch ($type) {
                case 'nco':
                    if (isset($night['duty_nco']) && $night['duty_nco'] === $oldValue) {
                        $nightMatches++;
                        if ($apply) {
                            $night['duty_nco'] = $newValue;
                        }
                    }
                    break;

                case 'uniform':
                    if (isset($night['uniform']) && $night['uniform'] === $oldValue) {
                        $nightMatches++;
                        if ($apply) {
                            $night['uniform'] = $newValue;
                        }
                    }
                    break;

                case 'staff':
                    if (isset($night['activities']) && is_array($night['activities'])) {
                        foreach ($night['activities'] as &$activity) {
                            if (is_array($activity) && isset($activity['instructor']) && $activity['instructor'] === $oldValue) {
                                $nightMatches++;
                                if ($apply) {
                                    $activity['instructor'] = $newValue;
                                }
                            }
                        }
                        unset($activity);
                    }
                    break;

                case 'activity_type':
                    if (isset($night['activities']) && is_array($night['activities'])) {
                        foreach ($night['activities'] as &$activity) {
                            if (is_array($activity) && isset($activity['activity_type']) && $activity['activity_type'] === $oldValue) {
                                $nightMatches++;
                                if ($apply) {
                                    $activity['activity_type'] = $newValue;
                                }
                            }
                        }
                        unset($activity);
                    }
                    break;

                case 'classification':
                    if (isset($night['activities']) && is_array($night['activities'])) {
                        foreach ($night['activities'] as &$activity) {
                            if (is_array($activity) && isset($activity['classifications']) && is_array($activity['classifications'])) {
                                foreach ($activity['classifications'] as &$cls) {
                                    if ($cls === $oldValue) {
                                        $nightMatches++;
                                        if ($apply) {
                                            $cls = $newValue;
                                        }
                                    }
                                }
                                unset($cls);
                            }
                        }
                        unset($activity);
                    }
                    break;
            }

            if ($nightMatches > 0) {
                $matchingNights++;
                $matchingOccurrences += $nightMatches;
                $monthChanged = true;
            }
        }
        unset($night);

        if ($apply && $monthChanged) {
            $pendingUpdates[$key] = json_encode($monthData);
        }
    }

    if ($apply && !empty($pendingUpdates)) {
        $startedTransaction = !$pdo->inTransaction();
        if ($startedTransaction) {
            $pdo->beginTransaction();
        }
        try {
            $updateStmt = $pdo->prepare("UPDATE settings SET `value` = ? WHERE `key` = ?");
            foreach ($pendingUpdates as $key => $encoded) {
                $updateStmt->execute([$encoded, $key]);
            }
            if ($startedTransaction) {
                $pdo->commit();
            }
        } catch (Throwable $e) {
            if ($startedTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    return [
        'matching_nights' => $matchingNights,
        'matching_occurrences' => $matchingOccurrences,
        'updated_months' => $apply ? count($pendingUpdates) : 0,
        'from_date' => $effectiveDate,
    ];
}

/**
 * Calculates all ISO dates (YYYY-MM-DD) within a month that fall on configured parade days.
 *
 * @param int      $year        Four-digit year.
 * @param int      $month       Month number (1-12).
 * @param string[] $allowedDays Day names (e.g. ['Monday', 'Thursday']).
 * @return string[] Chronologically ordered ISO date strings.
 */
function getParadeDatesForMonth(int $year, int $month, array $allowedDays): array {
    if ($year < 1970 || $year > 2100 || $month < 1 || $month > 12 || empty($allowedDays)) {
        return [];
    }

    $dates = [];
    $current = DateTimeImmutable::createFromFormat('!Y-n-j', "{$year}-{$month}-1");
    if ($current === false) {
        return [];
    }

    $daysInMonth = (int)$current->format('t');
    for ($day = 1; $day <= $daysInMonth; $day++) {
        $d = $current->setDate($year, $month, $day);
        if (in_array($d->format('l'), $allowedDays, true)) {
            $dates[] = $d->format('Y-m-d');
        }
    }

    return $dates;
}

/**
 * Creates a blank parade night skeleton matching the frontend programme structure.
 *
 * @param string   $date            ISO date string (YYYY-MM-DD).
 * @param string[] $classifications Configured classification column names.
 * @return array<string, mixed> Blank parade night entry.
 */
function buildBlankParadeNight(string $date, array $classifications): array {
    $activities = [];
    foreach ($classifications as $cls) {
        $activities[] = [
            'classifications' => [(string)$cls],
            'activity_type' => '',
            'name' => '',
            'instructor' => '',
        ];
    }

    return [
        'date' => $date,
        'uniform' => '',
        'notes' => [],
        'activities' => $activities,
        'duty_nco' => '',
        'duty_cadet' => '',
    ];
}

/**
 * Merges a duties-only update into an existing or newly initialized monthly programme.
 *
 * Generates any missing configured parade nights for the month so users with only `edit_duties`
 * can assign Duty NCO / Duty Cadet ahead of Staff planning the full programme, while strictly
 * ignoring any incoming changes to uniforms, activities, notes, month comments, or non-parade dates.
 *
 * @param array<string, mixed>      $config            Decoded `programme_config` settings.
 * @param array<string, mixed>|null $existingData      Existing decoded month programme, or null if new.
 * @param array<string, mixed>      $incomingProgramme Incoming programme payload from the client.
 * @param int                       $year              Target year.
 * @param int                       $month             Target month (1-12).
 * @return array<string, mixed> Sanitized monthly programme safe to persist.
 */
function mergeDutiesOnlyProgramme(
    array $config,
    ?array $existingData,
    array $incomingProgramme,
    int $year,
    int $month
): array {
    $paradeDays = is_array($config['parade_nights'] ?? null) ? $config['parade_nights'] : [];
    $classifications = is_array($config['classifications'] ?? null) ? $config['classifications'] : [];

    $incomingDuties = [];
    if (isset($incomingProgramme['parade_nights']) && is_array($incomingProgramme['parade_nights'])) {
        foreach ($incomingProgramme['parade_nights'] as $incomingNight) {
            if (!is_array($incomingNight) || empty($incomingNight['date']) || !is_string($incomingNight['date'])) {
                continue;
            }
            $incomingDuties[$incomingNight['date']] = [
                'duty_nco' => is_string($incomingNight['duty_nco'] ?? null) ? trim($incomingNight['duty_nco']) : '',
                'duty_cadet' => is_string($incomingNight['duty_cadet'] ?? null) ? trim($incomingNight['duty_cadet']) : '',
            ];
        }
    }

    $result = is_array($existingData) ? $existingData : [];
    if (!isset($result['month_comments']) || !is_array($result['month_comments'])) {
        $result['month_comments'] = [];
    }

    $nightsByDate = [];
    if (isset($result['parade_nights']) && is_array($result['parade_nights'])) {
        foreach ($result['parade_nights'] as $existingNight) {
            if (is_array($existingNight) && !empty($existingNight['date']) && is_string($existingNight['date'])) {
                $nightsByDate[$existingNight['date']] = $existingNight;
            }
        }
    }

    // Ensure all expected configured parade nights exist in the month skeleton
    foreach (getParadeDatesForMonth($year, $month, $paradeDays) as $expectedDate) {
        if (!isset($nightsByDate[$expectedDate])) {
            $nightsByDate[$expectedDate] = buildBlankParadeNight($expectedDate, $classifications);
        }
    }

    // Apply ONLY duty_nco and duty_cadet to valid parade nights
    foreach ($nightsByDate as $date => &$night) {
        if (isset($incomingDuties[$date])) {
            $night['duty_nco'] = $incomingDuties[$date]['duty_nco'];
            $night['duty_cadet'] = $incomingDuties[$date]['duty_cadet'];
        }
    }
    unset($night);

    ksort($nightsByDate);
    $result['parade_nights'] = array_values($nightsByDate);

    return $result;
}
