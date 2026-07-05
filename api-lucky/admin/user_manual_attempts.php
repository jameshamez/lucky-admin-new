<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $quizId = (int) ($input['quizId'] ?? 0);
        $username = $input['username'] ?? null;
        $fullName = $input['fullName'] ?? null;
        $answers = $input['answers'] ?? []; // [{questionId, selectedIndex}]

        if (!$quizId || !is_array($answers) || count($answers) === 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "quizId and answers are required"]);
            exit();
        }

        // Load the correct answers server-side — never trust correctIndex from the client
        $correctByQuestion = [];
        $res = $conn->query("SELECT id, correct_index FROM user_manual_quiz_questions WHERE quiz_id = " . $quizId);
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $correctByQuestion[(int) $row['id']] = (int) $row['correct_index'];
            }
        }

        $total = count($correctByQuestion);
        if ($total === 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Quiz has no questions"]);
            exit();
        }

        $correctCount = 0;
        $review = [];
        foreach ($answers as $a) {
            $qid = (int) ($a['questionId'] ?? 0);
            $selected = (int) ($a['selectedIndex'] ?? -1);
            if (!isset($correctByQuestion[$qid])) continue;
            $isCorrect = $selected === $correctByQuestion[$qid];
            if ($isCorrect) $correctCount++;
            $review[] = [
                "questionId" => $qid,
                "selectedIndex" => $selected,
                "correctIndex" => $correctByQuestion[$qid],
                "isCorrect" => $isCorrect,
            ];
        }

        $percent = (int) round(($correctCount / $total) * 100);

        $stmtPS = $conn->prepare("SELECT passing_score FROM user_manual_quizzes WHERE id = ?");
        $stmtPS->bind_param("i", $quizId);
        $stmtPS->execute();
        $quizRow = $stmtPS->get_result()->fetch_assoc();
        $passingScore = (int) ($quizRow['passing_score'] ?? 70);
        $passed = $percent >= $passingScore ? 1 : 0;

        $stmt = $conn->prepare("INSERT INTO user_manual_quiz_attempts
            (quiz_id, username, full_name, score_percent, correct_count, total_count, passed)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issiiii", $quizId, $username, $fullName, $percent, $correctCount, $total, $passed);
        $stmt->execute();

        echo json_encode([
            "status" => "success",
            "data" => [
                "correct" => $correctCount,
                "total" => $total,
                "percent" => $percent,
                "passingScore" => $passingScore,
                "passed" => (bool) $passed,
                "review" => $review,
            ]
        ]);
    } else {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
