<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
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

function fetchQuestions($conn, $quizId, $includeAnswer) {
    $questions = [];
    $stmt = $conn->prepare("SELECT * FROM user_manual_quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC, id ASC");
    $stmt->bind_param("i", $quizId);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $q = [
            "id" => (int) $row['id'],
            "question" => $row['question_text'],
            "options" => [$row['option_a'], $row['option_b'], $row['option_c'], $row['option_d']],
        ];
        if ($includeAnswer) {
            $q['correctIndex'] = (int) $row['correct_index'];
        }
        $questions[] = $q;
    }
    return $questions;
}

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
            $mode = $_GET['mode'] ?? 'edit';
            $stmt = $conn->prepare("SELECT * FROM user_manual_quizzes WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if (!$row) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Not found"]);
                exit();
            }
            $questionList = fetchQuestions($conn, $id, $mode !== 'take');
            echo json_encode([
                "status" => "success",
                "data" => [
                    "id" => (int) $row['id'],
                    "title" => $row['title'],
                    "category" => $row['category'],
                    "passingScore" => (int) $row['passing_score'],
                    "questions" => count($questionList),
                    "questionList" => $questionList,
                ]
            ]);
        } else {
            $data = [];
            $res = $conn->query("SELECT q.*, (SELECT COUNT(*) FROM user_manual_quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
                                FROM user_manual_quizzes q ORDER BY q.created_at DESC");
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $data[] = [
                        "id" => (int) $row['id'],
                        "title" => $row['title'],
                        "category" => $row['category'],
                        "passingScore" => (int) $row['passing_score'],
                        "questions" => (int) $row['question_count'],
                        "questionList" => [],
                    ];
                }
            }
            echo json_encode(["status" => "success", "data" => $data]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $title = $input['title'] ?? '';
        $category = $input['category'] ?? '';
        $passingScore = (int) ($input['passingScore'] ?? 70);
        $questionList = $input['questionList'] ?? [];

        if ($title === '') {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "title is required"]);
            exit();
        }

        $conn->begin_transaction();
        try {
            if (isset($input['id']) && $input['id']) {
                $quizId = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE user_manual_quizzes SET title = ?, category = ?, passing_score = ? WHERE id = ?");
                $stmt->bind_param("ssii", $title, $category, $passingScore, $quizId);
                $stmt->execute();

                $del = $conn->prepare("DELETE FROM user_manual_quiz_questions WHERE quiz_id = ?");
                $del->bind_param("i", $quizId);
                $del->execute();
            } else {
                $stmt = $conn->prepare("INSERT INTO user_manual_quizzes (title, category, passing_score) VALUES (?, ?, ?)");
                $stmt->bind_param("ssi", $title, $category, $passingScore);
                $stmt->execute();
                $quizId = $conn->insert_id;
            }

            $sort = 0;
            foreach ($questionList as $q) {
                $questionText = $q['question'] ?? '';
                $options = $q['options'] ?? ['', '', '', ''];
                $correctIndex = (int) ($q['correctIndex'] ?? 0);
                if ($questionText === '') continue;
                $ins = $conn->prepare("INSERT INTO user_manual_quiz_questions
                    (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_index, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $ins->bind_param(
                    "isssssii",
                    $quizId,
                    $questionText,
                    $options[0],
                    $options[1],
                    $options[2],
                    $options[3],
                    $correctIndex,
                    $sort
                );
                $ins->execute();
                $sort++;
            }

            $conn->commit();
            echo json_encode(["status" => "success", "id" => $quizId]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } elseif ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id is required"]);
            exit();
        }
        $stmt = $conn->prepare("DELETE FROM user_manual_quizzes WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
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
