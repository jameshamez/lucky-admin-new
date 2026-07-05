<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$result = null;
$error = null;
$url = $_POST['url'] ?? '';

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

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

function fetchHtml(string $url): array
{
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT => 40,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        CURLOPT_HTTPHEADER => [
            'Accept-Language: th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Charset: UTF-8,*;q=0.8',
        ],
        CURLOPT_HEADER => true,
    ]);

    $response = curl_exec($ch);

    if ($response === false) {
        $message = curl_error($ch);
        curl_close($ch);
        throw new Exception('cURL Error: ' . $message);
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: '';
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL) ?: $url;

    curl_close($ch);

    $rawHeaders = substr($response, 0, $headerSize);
    $html = substr($response, $headerSize);

    if ($httpCode >= 400) {
        throw new Exception('HTTP Error: ' . $httpCode);
    }

    if (trim($html) === '') {
        throw new Exception('ไม่พบ HTML จาก URL นี้');
    }

    $html = convertToUtf8($html, $contentType);

    return [
        'html' => $html,
        'http_code' => $httpCode,
        'content_type' => $contentType,
        'final_url' => $finalUrl,
        'raw_headers' => $rawHeaders,
    ];
}

function convertToUtf8(string $html, string $contentType = ''): string
{
    if (preg_match('/charset=([a-zA-Z0-9\-_]+)/i', $contentType, $matches)) {
        $charset = strtoupper(trim($matches[1]));
        if (!in_array($charset, ['UTF-8', 'UTF8'], true)) {
            $converted = @mb_convert_encoding($html, 'UTF-8', $charset);
            if ($converted !== false) {
                return $converted;
            }
        }
        return $html;
    }

    if (preg_match('/<meta[^>]+charset=["\']?\s*([a-zA-Z0-9\-_]+)/i', $html, $matches)) {
        $charset = strtoupper(trim($matches[1]));
        if (!in_array($charset, ['UTF-8', 'UTF8'], true)) {
            $converted = @mb_convert_encoding($html, 'UTF-8', $charset);
            if ($converted !== false) {
                return $converted;
            }
        }
        return $html;
    }

    $encoding = mb_detect_encoding(
        $html,
        ['UTF-8', 'Windows-874', 'TIS-620', 'ISO-8859-1', 'ASCII'],
        true
    );

    if ($encoding && strtoupper($encoding) !== 'UTF-8') {
        $converted = @mb_convert_encoding($html, 'UTF-8', $encoding);
        if ($converted !== false) {
            return $converted;
        }
    }

    return $html;
}

function cleanText(string $text): string
{
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text);
    return trim($text);
}

function makeAbsoluteUrl(string $baseUrl, string $relativeUrl): string
{
    $relativeUrl = trim($relativeUrl);

    if ($relativeUrl === '') {
        return '';
    }

    if (preg_match('~^(data:|mailto:|tel:|javascript:)~i', $relativeUrl)) {
        return $relativeUrl;
    }

    if (preg_match('~^https?://~i', $relativeUrl)) {
        return $relativeUrl;
    }

    $base = parse_url($baseUrl);
    if (!$base || empty($base['scheme']) || empty($base['host'])) {
        return $relativeUrl;
    }

    $scheme = $base['scheme'];
    $host = $base['host'];
    $port = isset($base['port']) ? ':' . $base['port'] : '';
    $path = $base['path'] ?? '/';

    if (strpos($relativeUrl, '//') === 0) {
        return $scheme . ':' . $relativeUrl;
    }

    if (strpos($relativeUrl, '/') === 0) {
        return $scheme . '://' . $host . $port . $relativeUrl;
    }

    $dir = preg_replace('~/[^/]*$~', '/', $path);
    return $scheme . '://' . $host . $port . $dir . $relativeUrl;
}

function loadDom(string $html): DOMDocument
{
    libxml_use_internal_errors(true);

    $dom = new DOMDocument('1.0', 'UTF-8');
    $htmlForDom = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
    $loaded = $dom->loadHTML('<?xml encoding="UTF-8">' . $htmlForDom, LIBXML_NOWARNING | LIBXML_NOERROR);

    libxml_clear_errors();

    if (!$loaded) {
        throw new Exception('ไม่สามารถ parse HTML ได้');
    }

    return $dom;
}

function extractTitle(DOMDocument $dom): string
{
    $nodes = $dom->getElementsByTagName('title');
    return $nodes->length > 0 ? cleanText($nodes->item(0)->textContent) : '';
}

function extractMetaTags(DOMDocument $dom): array
{
    $result = [];
    $metaTags = $dom->getElementsByTagName('meta');

    foreach ($metaTags as $meta) {
        $item = [
            'name' => cleanText($meta->getAttribute('name')),
            'property' => cleanText($meta->getAttribute('property')),
            'http_equiv' => cleanText($meta->getAttribute('http-equiv')),
            'content' => cleanText($meta->getAttribute('content')),
            'charset' => cleanText($meta->getAttribute('charset')),
        ];

        if (
            $item['name'] !== '' ||
            $item['property'] !== '' ||
            $item['http_equiv'] !== '' ||
            $item['content'] !== '' ||
            $item['charset'] !== ''
        ) {
            $result[] = $item;
        }
    }

    return $result;
}

function extractLinks(DOMDocument $dom, string $baseUrl): array
{
    $items = [];
    $nodes = $dom->getElementsByTagName('a');

    foreach ($nodes as $node) {
        $href = cleanText($node->getAttribute('href'));
        $text = cleanText($node->textContent);
        $title = cleanText($node->getAttribute('title'));
        $rel = cleanText($node->getAttribute('rel'));

        if ($href === '' && $text === '') {
            continue;
        }

        $items[] = [
            'text' => $text,
            'href' => $href,
            'absolute_href' => makeAbsoluteUrl($baseUrl, $href),
            'title' => $title,
            'rel' => $rel,
        ];
    }

    return $items;
}

function extractImages(DOMDocument $dom, string $baseUrl): array
{
    $items = [];
    $nodes = $dom->getElementsByTagName('img');

    foreach ($nodes as $node) {
        $src = cleanText($node->getAttribute('src'));
        $alt = cleanText($node->getAttribute('alt'));

        $items[] = [
            'src' => $src,
            'absolute_src' => makeAbsoluteUrl($baseUrl, $src),
            'alt' => $alt,
            'title' => cleanText($node->getAttribute('title')),
            'width' => cleanText($node->getAttribute('width')),
            'height' => cleanText($node->getAttribute('height')),
            'loading' => cleanText($node->getAttribute('loading')),
        ];
    }

    return $items;
}

function extractHeadings(DOMDocument $dom): array
{
    $result = [];

    for ($i = 1; $i <= 6; $i++) {
        $tag = 'h' . $i;
        $result[$tag] = [];
        $nodes = $dom->getElementsByTagName($tag);

        foreach ($nodes as $node) {
            $text = cleanText($node->textContent);
            if ($text !== '') {
                $result[$tag][] = $text;
            }
        }
    }

    return $result;
}

function extractParagraphs(DOMDocument $dom): array
{
    $items = [];
    $nodes = $dom->getElementsByTagName('p');

    foreach ($nodes as $node) {
        $text = cleanText($node->textContent);
        if ($text !== '') {
            $items[] = $text;
        }
    }

    return $items;
}

function extractLists(DOMDocument $dom): array
{
    $items = [];
    foreach (['ul', 'ol'] as $tag) {
        $nodes = $dom->getElementsByTagName($tag);

        foreach ($nodes as $node) {
            $listItems = [];
            foreach ($node->getElementsByTagName('li') as $li) {
                $text = cleanText($li->textContent);
                if ($text !== '') {
                    $listItems[] = $text;
                }
            }

            if (!empty($listItems)) {
                $items[] = [
                    'type' => $tag,
                    'items' => $listItems,
                ];
            }
        }
    }

    return $items;
}

function extractTables(DOMDocument $dom): array
{
    $tables = [];
    $nodes = $dom->getElementsByTagName('table');

    foreach ($nodes as $table) {
        $rows = [];
        foreach ($table->getElementsByTagName('tr') as $tr) {
            $cells = [];
            foreach ($tr->childNodes as $child) {
                if ($child instanceof DOMElement && in_array(strtolower($child->tagName), ['th', 'td'], true)) {
                    $cells[] = cleanText($child->textContent);
                }
            }
            if (!empty($cells)) {
                $rows[] = $cells;
            }
        }

        if (!empty($rows)) {
            $tables[] = $rows;
        }
    }

    return $tables;
}

function extractScripts(DOMDocument $dom): array
{
    $items = [];
    $nodes = $dom->getElementsByTagName('script');

    foreach ($nodes as $node) {
        $type = cleanText($node->getAttribute('type'));
        $src = cleanText($node->getAttribute('src'));
        $content = cleanText($node->textContent);

        $items[] = [
            'type' => $type,
            'src' => $src,
            'content_preview' => mb_substr($content, 0, 500, 'UTF-8'),
        ];
    }

    return $items;
}

function extractJsonLd(DOMDocument $dom): array
{
    $items = [];
    $nodes = $dom->getElementsByTagName('script');

    foreach ($nodes as $node) {
        $type = strtolower(trim($node->getAttribute('type')));
        if ($type === 'application/ld+json') {
            $raw = trim($node->textContent);
            $decoded = json_decode($raw, true);

            $items[] = [
                'raw' => $raw,
                'decoded' => $decoded,
                'json_error' => json_last_error_msg(),
            ];
        }
    }

    return $items;
}

function extractBodyText(DOMDocument $dom): string
{
    $bodyList = $dom->getElementsByTagName('body');
    if ($bodyList->length === 0) {
        return '';
    }

    return cleanText($bodyList->item(0)->textContent ?? '');
}

function extractTopKeywords(string $bodyText): array
{
    if ($bodyText === '') {
        return [];
    }

    $text = mb_strtolower($bodyText, 'UTF-8');
    $text = preg_replace('/[^\p{L}\p{N}\s\-_]+/u', ' ', $text);
    $text = preg_replace('/\s+/u', ' ', $text);

    $words = preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY);

    $stopWords = [
        'และ','หรือ','ของ','ที่','ใน','เป็น','กับ','จาก','โดย','ได้','ให้','เพื่อ','เมื่อ','แล้ว',
        'แต่','ยัง','อีก','ว่า','นี้','นั้น','คือ','มี',
        'the','and','or','of','to','a','is','are','in','on','for','with','by','at','an','be',
        'this','that','it','as','you','your','our','we','us','from','not','can','will',
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

    return array_slice($counts, 0, 50, true);
}

function analyzePage(string $url): array
{
    $response = fetchHtml($url);
    $html = $response['html'];
    $finalUrl = $response['final_url'];

    $dom = loadDom($html);

    $title = extractTitle($dom);
    $metaTags = extractMetaTags($dom);
    $headings = extractHeadings($dom);
    $paragraphs = extractParagraphs($dom);
    $lists = extractLists($dom);
    $tables = extractTables($dom);
    $links = extractLinks($dom, $finalUrl);
    $images = extractImages($dom, $finalUrl);
    $scripts = extractScripts($dom);
    $jsonLd = extractJsonLd($dom);
    $bodyText = extractBodyText($dom);

    return [
        'request' => [
            'input_url' => $url,
            'final_url' => $finalUrl,
            'http_code' => $response['http_code'],
            'content_type' => $response['content_type'],
            'analyzed_at' => date('Y-m-d H:i:s'),
        ],
        'seo' => [
            'title' => $title,
            'meta_tags' => $metaTags,
            'headings' => $headings,
            'top_keywords' => extractTopKeywords($bodyText),
        ],
        'content' => [
            'body_text' => $bodyText,
            'paragraphs' => $paragraphs,
            'lists' => $lists,
            'tables' => $tables,
        ],
        'media' => [
            'images' => $images,
        ],
        'navigation' => [
            'links' => $links,
        ],
        'structured_data' => [
            'json_ld' => $jsonLd,
        ],
        'technical' => [
            'scripts' => $scripts,
            'raw_headers' => $response['raw_headers'],
            'html_preview' => mb_substr($html, 0, 3000, 'UTF-8'),
        ],
        'summary' => [
            'meta_tag_count' => count($metaTags),
            'link_count' => count($links),
            'image_count' => count($images),
            'paragraph_count' => count($paragraphs),
            'table_count' => count($tables),
            'script_count' => count($scripts),
        ]
    ];
}

if (isset($_GET['export']) && isset($_POST['export_payload'])) {
    $payload = json_decode($_POST['export_payload'], true);

    if (is_array($payload)) {
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="full-page-data.json"');
        echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_GET['export'])) {
    try {
        $url = normalizeUrl($_POST['url'] ?? '');
        $result = analyzePage($url);
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>Full Page Extractor</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body{font-family:Tahoma,Arial,sans-serif;background:#f6f8fb;margin:0;color:#1f2937}
        .wrap{max-width:1200px;margin:24px auto;padding:16px}
        .card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,.06);margin-bottom:16px}
        h1,h2,h3{margin-top:0}
        input[type=text]{width:100%;padding:14px;border:1px solid #d1d5db;border-radius:12px;font-size:16px}
        button{padding:12px 16px;border:none;border-radius:12px;background:#2563eb;color:#fff;font-weight:bold;cursor:pointer}
        .row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .muted{color:#6b7280}
        pre{white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e5e7eb;padding:14px;border-radius:12px;max-height:420px;overflow:auto}
        .error{background:#fee2e2;color:#991b1b;padding:12px;border-radius:12px;margin-bottom:16px}
        .tag{display:inline-block;background:#e0e7ff;color:#3730a3;padding:6px 10px;border-radius:999px;margin:4px 6px 0 0}
        ul{padding-left:20px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top}
        th{background:#eff6ff}
        @media (max-width: 900px){.row{grid-template-columns:1fr}}
    </style>
</head>
<body>
<div class="wrap">
    <div class="card">
        <h1>Full Page Extractor</h1>
        <p class="muted">ดึงข้อมูลทั้งหน้าจาก HTML: meta, headings, links, images, paragraphs, tables, scripts, json-ld และ body text</p>

        <?php if ($error): ?>
            <div class="error"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="POST">
            <input type="text" name="url" placeholder="https://example.com" value="<?= e($url) ?>" required>
            <div style="margin-top:12px;">
                <button type="submit">ดึงข้อมูลทั้งหน้า</button>
            </div>
        </form>

        <?php if ($result): ?>
            <form method="POST" action="?export=1" style="margin-top:12px;">
                <input type="hidden" name="export_payload" value="<?= e(json_encode($result, JSON_UNESCAPED_UNICODE)) ?>">
                <button type="submit">Export JSON</button>
            </form>
        <?php endif; ?>
    </div>

    <?php if ($result): ?>
        <div class="row">
            <div class="card">
                <h2>ข้อมูลหลัก</h2>
                <p><strong>URL:</strong> <?= e($result['request']['final_url']) ?></p>
                <p><strong>HTTP Code:</strong> <?= e((string)$result['request']['http_code']) ?></p>
                <p><strong>Content-Type:</strong> <?= e($result['request']['content_type']) ?></p>
                <p><strong>Title:</strong> <?= e($result['seo']['title']) ?></p>
                <p><strong>Meta tags:</strong> <?= count($result['seo']['meta_tags']) ?></p>
                <p><strong>Links:</strong> <?= count($result['navigation']['links']) ?></p>
                <p><strong>Images:</strong> <?= count($result['media']['images']) ?></p>
                <p><strong>Paragraphs:</strong> <?= count($result['content']['paragraphs']) ?></p>
                <p><strong>Tables:</strong> <?= count($result['content']['tables']) ?></p>
                <p><strong>Scripts:</strong> <?= count($result['technical']['scripts']) ?></p>
            </div>

            <div class="card">
                <h2>Top Keywords</h2>
                <?php foreach ($result['seo']['top_keywords'] as $keyword => $count): ?>
                    <span class="tag"><?= e($keyword) ?> (<?= (int)$count ?>)</span>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="card">
            <h2>Headings</h2>
            <?php foreach ($result['seo']['headings'] as $tag => $items): ?>
                <h3><?= e(strtoupper($tag)) ?></h3>
                <?php if ($items): ?>
                    <ul>
                        <?php foreach ($items as $item): ?>
                            <li><?= e($item) ?></li>
                        <?php endforeach; ?>
                    </ul>
                <?php else: ?>
                    <p class="muted">ไม่พบ</p>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>

        <div class="card">
            <h2>Meta Tags</h2>
            <pre><?= e(json_encode($result['seo']['meta_tags'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
        </div>

        <div class="card">
            <h2>Links</h2>
            <pre><?= e(json_encode(array_slice($result['navigation']['links'], 0, 100), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
        </div>

        <div class="card">
            <h2>Images</h2>
            <pre><?= e(json_encode(array_slice($result['media']['images'], 0, 100), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
        </div>

        <div class="card">
            <h2>Paragraphs</h2>
            <pre><?= e(json_encode($result['content']['paragraphs'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
        </div>

        <div class="card">
            <h2>Tables</h2>
            <pre><?= e(json_encode($result['content']['tables'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
        </div>

        <div class="card">
            <h2>JSON-LD</h2>
            <pre><?= e(json_encode($result['structured_data']['json_ld'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?></pre>
        </div>

        <div class="card">
            <h2>Body Text ทั้งหน้า</h2>
            <pre><?= e($result['content']['body_text']) ?></pre>
        </div>
    <?php endif; ?>
</div>
</body>
</html>