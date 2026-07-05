<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

$result = null;
$error = null;
$url = $_POST['url'] ?? ($_GET['url'] ?? '');

function normalizeUrl(string $url): string
{
    $url = trim($url);

    if ($url === '') {
        throw new Exception('กรุณากรอก URL');
    }

    if (!preg_match('~^https?://~i', $url)) {
        $url = 'https://' . $url;
    }

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        throw new Exception('URL ไม่ถูกต้อง');
    }

    return $url;
}

function fetchHtml(string $url): string
{
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        CURLOPT_HTTPHEADER => [
            'Accept-Language: th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Charset: UTF-8,*;q=0.8'
        ],
    ]);

    $html = curl_exec($ch);

    if (curl_errno($ch)) {
        $message = curl_error($ch);
        curl_close($ch);
        throw new Exception('cURL Error: ' . $message);
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: '';
    curl_close($ch);

    if ($httpCode >= 400) {
        throw new Exception('HTTP Error: ' . $httpCode);
    }

    if ($html === false || trim($html) === '') {
        throw new Exception('ไม่สามารถดึง HTML จาก URL นี้ได้');
    }

    // แปลงเป็น UTF-8 ถ้า header ระบุ charset
    if (preg_match('/charset=([a-zA-Z0-9\-_]+)/i', $contentType, $matches)) {
        $detectedCharset = strtoupper(trim($matches[1]));
        if ($detectedCharset !== 'UTF-8' && $detectedCharset !== 'UTF8') {
            $converted = @mb_convert_encoding($html, 'UTF-8', $detectedCharset);
            if ($converted !== false) {
                $html = $converted;
            }
        }
    } else {
        // เดา encoding เพิ่ม เผื่อเว็บไม่ส่ง charset มา
        $encoding = mb_detect_encoding($html, ['UTF-8', 'TIS-620', 'Windows-874', 'ISO-8859-1', 'ASCII'], true);
        if ($encoding && strtoupper($encoding) !== 'UTF-8') {
            $converted = @mb_convert_encoding($html, 'UTF-8', $encoding);
            if ($converted !== false) {
                $html = $converted;
            }
        }
    }

    return $html;
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function cleanText(string $text): string
{
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text);
    return trim($text);
}

function extractMetaContent(DOMDocument $dom, string $targetName = '', string $targetProperty = ''): string
{
    $metaTags = $dom->getElementsByTagName('meta');

    foreach ($metaTags as $meta) {
        $name = strtolower(trim($meta->getAttribute('name')));
        $property = strtolower(trim($meta->getAttribute('property')));
        $content = cleanText($meta->getAttribute('content'));

        if ($targetName !== '' && $name === strtolower($targetName)) {
            return $content;
        }

        if ($targetProperty !== '' && $property === strtolower($targetProperty)) {
            return $content;
        }
    }

    return '';
}

function getNodeTexts(DOMDocument $dom, string $tagName): array
{
    $items = [];
    $nodes = $dom->getElementsByTagName($tagName);

    foreach ($nodes as $node) {
        $text = cleanText($node->textContent);
        if ($text !== '') {
            $items[] = $text;
        }
    }

    return array_values(array_unique($items));
}

function extractCanonical(DOMDocument $dom): string
{
    $links = $dom->getElementsByTagName('link');

    foreach ($links as $link) {
        $rel = strtolower(trim($link->getAttribute('rel')));
        if ($rel === 'canonical') {
            return cleanText($link->getAttribute('href'));
        }
    }

    return '';
}

function extractBodyText(DOMDocument $dom): string
{
    $bodyList = $dom->getElementsByTagName('body');

    if ($bodyList->length === 0) {
        return '';
    }

    $bodyText = $bodyList->item(0)->textContent ?? '';
    return cleanText($bodyText);
}

function extractTopKeywords(
    string $title,
    string $description,
    string $keywords,
    array $h1List,
    array $h2List,
    string $bodyText
): array {
    $textParts = array_merge(
        [$title, $description, $keywords],
        $h1List,
        $h2List,
        [$bodyText]
    );

    $fullText = implode(' ', array_filter($textParts, fn($item) => trim($item) !== ''));

    if (trim($fullText) === '') {
        return [];
    }

    $cleanText = mb_strtolower($fullText, 'UTF-8');
    $cleanText = preg_replace('/[^\p{L}\p{N}\s\-_]+/u', ' ', $cleanText);
    $cleanText = preg_replace('/\s+/u', ' ', $cleanText);

    $words = preg_split('/\s+/u', $cleanText, -1, PREG_SPLIT_NO_EMPTY);

    $stopWords = [
        'และ','หรือ','ของ','ที่','ใน','เป็น','กับ','จาก','โดย','ได้','ให้','เพื่อ','เมื่อ','แล้ว',
        'แต่','มาก','น้อย','ยัง','ไว้','ก็','ว่า','นี้','นั้น','อีก','แบบ','เช่น','คือ','ซึ่ง','มี',
        'the','and','or','of','to','a','is','are','in','on','for','with','by','at','an','be',
        'this','that','it','as','your','our','you','we','us','how','what','why','can','will',
        'www','com','net','org','http','https'
    ];

    $filtered = array_filter($words, function ($word) use ($stopWords) {
        if (mb_strlen($word, 'UTF-8') < 2) {
            return false;
        }

        if (in_array($word, $stopWords, true)) {
            return false;
        }

        if (preg_match('/^\d+$/', $word)) {
            return false;
        }

        return true;
    });

    if (empty($filtered)) {
        return [];
    }

    $counts = array_count_values($filtered);
    arsort($counts);

    return array_slice($counts, 0, 25, true);
}

function calculateSeoScore(array $data): array
{
    $score = 0;
    $checks = [];

    $titleLength = mb_strlen($data['title'], 'UTF-8');
    if ($titleLength > 0) {
        if ($titleLength >= 30 && $titleLength <= 60) {
            $score += 15;
            $checks[] = ['label' => 'Title length', 'status' => 'good', 'message' => "ดี ({$titleLength} ตัวอักษร)"];
        } else {
            $score += 8;
            $checks[] = ['label' => 'Title length', 'status' => 'warn', 'message' => "มี title แต่ความยาวยังไม่ค่อยเหมาะ ({$titleLength})"];
        }
    } else {
        $checks[] = ['label' => 'Title length', 'status' => 'bad', 'message' => 'ไม่พบ title'];
    }

    $descLength = mb_strlen($data['meta_description'], 'UTF-8');
    if ($descLength > 0) {
        if ($descLength >= 70 && $descLength <= 160) {
            $score += 15;
            $checks[] = ['label' => 'Meta description', 'status' => 'good', 'message' => "ดี ({$descLength} ตัวอักษร)"];
        } else {
            $score += 8;
            $checks[] = ['label' => 'Meta description', 'status' => 'warn', 'message' => "มี description แต่ความยาวยังไม่ค่อยเหมาะ ({$descLength})"];
        }
    } else {
        $checks[] = ['label' => 'Meta description', 'status' => 'bad', 'message' => 'ไม่พบ meta description'];
    }

    if (!empty($data['h1'])) {
        if (count($data['h1']) === 1) {
            $score += 15;
            $checks[] = ['label' => 'H1', 'status' => 'good', 'message' => 'มี H1 1 ตัวพอดี'];
        } else {
            $score += 8;
            $checks[] = ['label' => 'H1', 'status' => 'warn', 'message' => 'มี H1 มากกว่า 1 ตัว'];
        }
    } else {
        $checks[] = ['label' => 'H1', 'status' => 'bad', 'message' => 'ไม่พบ H1'];
    }

    if (!empty($data['h2'])) {
        $score += 10;
        $checks[] = ['label' => 'H2', 'status' => 'good', 'message' => 'พบ H2'];
    } else {
        $checks[] = ['label' => 'H2', 'status' => 'warn', 'message' => 'ไม่พบ H2'];
    }

    if ($data['canonical'] !== '') {
        $score += 10;
        $checks[] = ['label' => 'Canonical', 'status' => 'good', 'message' => 'พบ canonical'];
    } else {
        $checks[] = ['label' => 'Canonical', 'status' => 'warn', 'message' => 'ไม่พบ canonical'];
    }

    if ($data['og_title'] !== '' || $data['og_description'] !== '') {
        $score += 10;
        $checks[] = ['label' => 'Open Graph', 'status' => 'good', 'message' => 'พบ Open Graph บางส่วน'];
    } else {
        $checks[] = ['label' => 'Open Graph', 'status' => 'warn', 'message' => 'ไม่พบ Open Graph'];
    }

    if ($data['meta_keywords'] !== '') {
        $score += 5;
        $checks[] = ['label' => 'Meta keywords', 'status' => 'good', 'message' => 'พบ meta keywords'];
    } else {
        $checks[] = ['label' => 'Meta keywords', 'status' => 'warn', 'message' => 'ไม่พบ meta keywords'];
    }

    $bodyLen = mb_strlen($data['body_text'], 'UTF-8');
    if ($bodyLen >= 300) {
        $score += 10;
        $checks[] = ['label' => 'Body content', 'status' => 'good', 'message' => 'เนื้อหามีความยาวพอสมควร'];
    } elseif ($bodyLen > 0) {
        $score += 5;
        $checks[] = ['label' => 'Body content', 'status' => 'warn', 'message' => 'มีเนื้อหา แต่ค่อนข้างน้อย'];
    } else {
        $checks[] = ['label' => 'Body content', 'status' => 'bad', 'message' => 'ไม่พบเนื้อหาหลัก'];
    }

    if (!empty($data['top_keywords'])) {
        $score += 10;
        $checks[] = ['label' => 'Keyword extraction', 'status' => 'good', 'message' => 'สามารถสรุป keyword ได้'];
    } else {
        $checks[] = ['label' => 'Keyword extraction', 'status' => 'bad', 'message' => 'สรุป keyword ไม่ได้'];
    }

    $score = min(100, $score);

    if ($score >= 80) {
        $grade = 'ดีมาก';
    } elseif ($score >= 60) {
        $grade = 'ดี';
    } elseif ($score >= 40) {
        $grade = 'พอใช้';
    } else {
        $grade = 'ควรปรับปรุง';
    }

    return [
        'score' => $score,
        'grade' => $grade,
        'checks' => $checks,
    ];
}

function extractSeoData(string $html, string $url): array
{
    libxml_use_internal_errors(true);

    $dom = new DOMDocument('1.0', 'UTF-8');

    // สำคัญมาก: บังคับให้ DOMDocument อ่านไทยเป็น UTF-8
    $htmlForDom = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
    $loaded = $dom->loadHTML('<?xml encoding="UTF-8">' . $htmlForDom, LIBXML_NOWARNING | LIBXML_NOERROR);

    libxml_clear_errors();

    if (!$loaded) {
        throw new Exception('ไม่สามารถ parse HTML ได้');
    }

    $titleNodes = $dom->getElementsByTagName('title');
    $title = $titleNodes->length > 0 ? cleanText($titleNodes->item(0)->textContent) : '';

    $metaDescription = extractMetaContent($dom, 'description');
    $metaKeywords = extractMetaContent($dom, 'keywords');

    $ogTitle = extractMetaContent($dom, '', 'og:title');
    $ogDescription = extractMetaContent($dom, '', 'og:description');

    if ($title === '' && $ogTitle !== '') {
        $title = $ogTitle;
    }

    if ($metaDescription === '' && $ogDescription !== '') {
        $metaDescription = $ogDescription;
    }

    $h1List = getNodeTexts($dom, 'h1');
    $h2List = getNodeTexts($dom, 'h2');
    $canonical = extractCanonical($dom);
    $bodyText = extractBodyText($dom);

    $topKeywords = extractTopKeywords(
        $title,
        $metaDescription,
        $metaKeywords,
        $h1List,
        $h2List,
        $bodyText
    );

    $data = [
        'url' => $url,
        'title' => $title,
        'meta_description' => $metaDescription,
        'meta_keywords' => $metaKeywords,
        'og_title' => $ogTitle,
        'og_description' => $ogDescription,
        'canonical' => $canonical,
        'h1' => $h1List,
        'h2' => $h2List,
        'body_text' => $bodyText,
        'top_keywords' => $topKeywords,
        'analyzed_at' => date('Y-m-d H:i:s'),
    ];

    $data['seo_score'] = calculateSeoScore($data);

    return $data;
}

function exportJson(array $result): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="seo-analysis.json"');
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function exportCsv(array $result): void
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="seo-analysis.csv"');

    $output = fopen('php://output', 'w');

    // BOM สำหรับ Excel
    fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

    fputcsv($output, ['Field', 'Value']);
    fputcsv($output, ['URL', $result['url']]);
    fputcsv($output, ['Title', $result['title']]);
    fputcsv($output, ['Meta Description', $result['meta_description']]);
    fputcsv($output, ['Meta Keywords', $result['meta_keywords']]);
    fputcsv($output, ['OG Title', $result['og_title']]);
    fputcsv($output, ['OG Description', $result['og_description']]);
    fputcsv($output, ['Canonical', $result['canonical']]);
    fputcsv($output, ['SEO Score', $result['seo_score']['score']]);
    fputcsv($output, ['SEO Grade', $result['seo_score']['grade']]);
    fputcsv($output, ['H1', implode(' | ', $result['h1'])]);
    fputcsv($output, ['H2', implode(' | ', $result['h2'])]);

    fputcsv($output, []);
    fputcsv($output, ['Top Keywords', 'Count']);
    foreach ($result['top_keywords'] as $keyword => $count) {
        fputcsv($output, [$keyword, $count]);
    }

    fclose($output);
    exit;
}

function scoreColorClass(int $score): string
{
    if ($score >= 80) {
        return 'score-good';
    }

    if ($score >= 60) {
        return 'score-mid';
    }

    return 'score-bad';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $url = normalizeUrl($_POST['url'] ?? '');
        $html = fetchHtml($url);
        $result = extractSeoData($html, $url);
        $_SESSION['seo_result'] = $result;
    } catch (Throwable $e) {
        $error = $e->getMessage();
        unset($_SESSION['seo_result']);
    }
}

if (isset($_GET['export']) && isset($_SESSION['seo_result'])) {
    if ($_GET['export'] === 'json') {
        exportJson($_SESSION['seo_result']);
    }

    if ($_GET['export'] === 'csv') {
        exportCsv($_SESSION['seo_result']);
    }
}

if (!$result && isset($_SESSION['seo_result'])) {
    $result = $_SESSION['seo_result'];
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>SEO Analyzer Pro Thai Fix</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; }

        body {
            margin: 0;
            font-family: Tahoma, Arial, sans-serif;
            background: linear-gradient(135deg, #eef2ff, #f8fafc);
            color: #0f172a;
        }

        .wrapper {
            max-width: 1180px;
            margin: 32px auto;
            padding: 16px;
        }

        .hero {
            background: linear-gradient(135deg, #1d4ed8, #7c3aed);
            color: #fff;
            border-radius: 24px;
            padding: 28px;
            box-shadow: 0 20px 50px rgba(37, 99, 235, 0.25);
            margin-bottom: 24px;
        }

        .hero h1 {
            margin: 0 0 10px;
            font-size: 34px;
        }

        .hero p {
            margin: 0;
            opacity: 0.92;
            line-height: 1.7;
        }

        .panel {
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.7);
            border-radius: 22px;
            padding: 22px;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
            margin-bottom: 20px;
        }

        form {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
        }

        .input-wrap {
            flex: 1;
            min-width: 280px;
        }

        input[type="text"] {
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            padding: 15px 16px;
            font-size: 16px;
            outline: none;
            transition: 0.2s ease;
            background: #fff;
        }

        input[type="text"]:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }

        button, .btn {
            border: none;
            border-radius: 14px;
            padding: 14px 18px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s ease;
        }

        .btn-primary {
            background: #2563eb;
            color: #fff;
        }

        .btn-primary:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #0f172a;
        }

        .btn-secondary:hover {
            background: #cbd5e1;
            transform: translateY(-1px);
        }

        .error {
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 14px 16px;
            border-radius: 14px;
            margin-bottom: 18px;
        }

        .grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 20px;
        }

        .mini-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }

        .stat-card {
            background: linear-gradient(180deg, #ffffff, #f8fafc);
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 18px;
        }

        .stat-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 8px;
        }

        .stat-value {
            font-size: 26px;
            font-weight: 800;
        }

        .seo-score-box {
            border-radius: 22px;
            padding: 24px;
            color: #fff;
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .score-good { background: linear-gradient(135deg, #16a34a, #22c55e); }
        .score-mid { background: linear-gradient(135deg, #d97706, #f59e0b); }
        .score-bad { background: linear-gradient(135deg, #dc2626, #ef4444); }

        .score-number {
            font-size: 56px;
            font-weight: 900;
            line-height: 1;
            margin-bottom: 8px;
        }

        .score-grade {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .section-title {
            font-size: 18px;
            font-weight: 800;
            margin: 0 0 14px;
        }

        .field-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 14px;
        }

        .field-label {
            display: block;
            font-size: 13px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        .field-value {
            line-height: 1.8;
            word-break: break-word;
        }

        .muted {
            color: #64748b;
        }

        .empty {
            color: #94a3b8;
            font-style: italic;
        }

        .pill-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .pill {
            background: #e0e7ff;
            color: #3730a3;
            border-radius: 999px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: 600;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 16px;
        }

        th, td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
            font-size: 14px;
        }

        th {
            background: #eff6ff;
            color: #1e3a8a;
        }

        .status-list {
            display: grid;
            gap: 10px;
        }

        .status-item {
            border-radius: 14px;
            padding: 12px 14px;
            border: 1px solid #e2e8f0;
            background: #fff;
        }

        .status-top {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            align-items: center;
            margin-bottom: 6px;
        }

        .badge {
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
        }

        .badge-good {
            background: #dcfce7;
            color: #166534;
        }

        .badge-warn {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-bad {
            background: #fee2e2;
            color: #991b1b;
        }

        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
        }

        .footer-note {
            font-size: 13px;
            color: #64748b;
            margin-top: 8px;
            line-height: 1.7;
        }

        @media (max-width: 900px) {
            .grid {
                grid-template-columns: 1fr;
            }

            .mini-grid {
                grid-template-columns: 1fr;
            }

            .score-number {
                font-size: 46px;
            }

            .hero h1 {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="hero">
        <h1>SEO Analyzer Pro</h1>
        <p>เวอร์ชันแก้ charset ภาษาไทยแล้ว ช่วยลดปัญหาข้อความกลายเป็นต่างดาวเวลาอ่าน Title, Meta, H1, H2 และเนื้อหาจากเว็บ</p>
    </div>

    <div class="panel">
        <?php if ($error): ?>
            <div class="error"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="input-wrap">
                <input
                    type="text"
                    name="url"
                    placeholder="เช่น example.com หรือ https://example.com"
                    value="<?= e($url) ?>"
                    required
                >
            </div>
            <button type="submit" class="btn-primary">วิเคราะห์ SEO</button>
        </form>

        <?php if ($result): ?>
            <div class="actions">
                <a class="btn btn-secondary" href="?export=json">Export JSON</a>
                <a class="btn btn-secondary" href="?export=csv">Export CSV</a>
            </div>
        <?php endif; ?>

        <div class="footer-note">
            หมายเหตุ: ถ้าเว็บปลายทาง render เนื้อหาด้วย JavaScript หนักมาก บางข้อมูลอาจไม่ครบ เพราะโค้ดนี้ใช้ cURL + DOMDocument ยังไม่ได้รัน JS เหมือน browser จริง
        </div>
    </div>

    <?php if ($result): ?>
        <div class="grid">
            <div>
                <div class="panel">
                    <h2 class="section-title">ข้อมูลหลักของหน้าเว็บ</h2>

                    <div class="field-box">
                        <span class="field-label">URL</span>
                        <div class="field-value"><?= e($result['url']) ?></div>
                    </div>

                    <div class="field-box">
                        <span class="field-label">Title</span>
                        <div class="field-value"><?= $result['title'] !== '' ? e($result['title']) : '<span class="empty">ไม่พบ title</span>' ?></div>
                    </div>

                    <div class="field-box">
                        <span class="field-label">Meta Description</span>
                        <div class="field-value"><?= $result['meta_description'] !== '' ? e($result['meta_description']) : '<span class="empty">ไม่พบ meta description</span>' ?></div>
                    </div>

                    <div class="field-box">
                        <span class="field-label">Meta Keywords</span>
                        <div class="field-value"><?= $result['meta_keywords'] !== '' ? e($result['meta_keywords']) : '<span class="empty">ไม่พบ meta keywords</span>' ?></div>
                    </div>

                    <div class="field-box">
                        <span class="field-label">Canonical</span>
                        <div class="field-value"><?= $result['canonical'] !== '' ? e($result['canonical']) : '<span class="empty">ไม่พบ canonical</span>' ?></div>
                    </div>

                    <div class="field-box">
                        <span class="field-label">Open Graph Title</span>
                        <div class="field-value"><?= $result['og_title'] !== '' ? e($result['og_title']) : '<span class="empty">ไม่พบ og:title</span>' ?></div>
                    </div>

                    <div class="field-box">
                        <span class="field-label">Open Graph Description</span>
                        <div class="field-value"><?= $result['og_description'] !== '' ? e($result['og_description']) : '<span class="empty">ไม่พบ og:description</span>' ?></div>
                    </div>
                </div>

                <div class="panel">
                    <h2 class="section-title">Heading Structure</h2>

                    <div class="field-box">
                        <span class="field-label">H1</span>
                        <?php if (!empty($result['h1'])): ?>
                            <div class="pill-list">
                                <?php foreach ($result['h1'] as $item): ?>
                                    <span class="pill"><?= e($item) ?></span>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="empty">ไม่พบ H1</div>
                        <?php endif; ?>
                    </div>

                    <div class="field-box">
                        <span class="field-label">H2</span>
                        <?php if (!empty($result['h2'])): ?>
                            <div class="pill-list">
                                <?php foreach ($result['h2'] as $item): ?>
                                    <span class="pill"><?= e($item) ?></span>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="empty">ไม่พบ H2</div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <div>
                <div class="panel">
                    <div class="seo-score-box <?= scoreColorClass((int)$result['seo_score']['score']) ?>">
                        <div class="score-number"><?= (int)$result['seo_score']['score'] ?></div>
                        <div class="score-grade">SEO ระดับ: <?= e($result['seo_score']['grade']) ?></div>
                        <div>วิเคราะห์เมื่อ <?= e($result['analyzed_at']) ?></div>
                    </div>
                </div>

                <div class="panel">
                    <h2 class="section-title">สรุปตัวเลข</h2>
                    <div class="mini-grid">
                        <div class="stat-card">
                            <div class="stat-label">จำนวน H1</div>
                            <div class="stat-value"><?= count($result['h1']) ?></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">จำนวน H2</div>
                            <div class="stat-value"><?= count($result['h2']) ?></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Keyword ที่สรุปได้</div>
                            <div class="stat-value"><?= count($result['top_keywords']) ?></div>
                        </div>
                    </div>
                </div>

                <div class="panel">
                    <h2 class="section-title">SEO Checks</h2>
                    <div class="status-list">
                        <?php foreach ($result['seo_score']['checks'] as $check): ?>
                            <div class="status-item">
                                <div class="status-top">
                                    <strong><?= e($check['label']) ?></strong>
                                    <?php if ($check['status'] === 'good'): ?>
                                        <span class="badge badge-good">GOOD</span>
                                    <?php elseif ($check['status'] === 'warn'): ?>
                                        <span class="badge badge-warn">WARN</span>
                                    <?php else: ?>
                                        <span class="badge badge-bad">BAD</span>
                                    <?php endif; ?>
                                </div>
                                <div class="muted"><?= e($check['message']) ?></div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel">
            <h2 class="section-title">Top Keywords</h2>
            <?php if (!empty($result['top_keywords'])): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Keyword</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($result['top_keywords'] as $keyword => $count): ?>
                            <tr>
                                <td><?= e($keyword) ?></td>
                                <td><?= (int)$count ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div class="empty">ยังไม่พบ keyword ที่สรุปได้</div>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
</body>
</html>