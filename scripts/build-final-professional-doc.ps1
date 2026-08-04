$ErrorActionPreference = 'Stop'
$root = Resolve-Path '..'
$source = Join-Path $root 'Approved FYP - final-polished-figures.docx'
$output = Join-Path $root 'Approved FYP - final-professional.docx'
Copy-Item -LiteralPath $source -Destination $output -Force

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing

$imageMap = @{
  '4'='fig-4-01-system-architecture.png'; '5'='fig-4-02-component-diagram.png'; '6'='fig-4-03-er-diagram.png'; '7'='fig-4-04-workflow-state-diagram.png';
  '8'='fig-4-05-use-case-diagram.png'; '9'='fig-4-06-overall-process-activity.png'; '10'='fig-4-07-lecturer-application-activity.png';
  '11'='fig-4-08-hod-dean-review-activity.png'; '12'='fig-4-09-hr-verification-eligibility-activity.png'; '13'='fig-4-10-committee-review-activity.png';
  '14'='fig-4-11-application-submission-sequence.png'; '15'='fig-4-12-eligibility-sequence-diagram.png'; '16'='fig-4-13-committee-recommendation-sequence.png';
  '17'='fig-4-14-login.png'; '18'='fig-4-15-hod-dashboard.png'; '19'='fig-4-16-hr-dashboard.png'; '20'='fig-4-17-hr-master-queue.png';
  '21'='fig-4-18-hr-verification-detail.png'; '22'='fig-4-19-committee-queue.png'; '23'='fig-4-20-analytics-reports.png';
  '24'='fig-4-21-sysadmin-dashboard.png'; '25'='fig-4-22-promotion-criteria-config.png'; '26'='fig-4-23-mobile-hr-dashboard.png';
  '27'='fig-4-24-deployment-diagram.png'
}

$zip = [System.IO.Compression.ZipFile]::Open($output, [System.IO.Compression.ZipArchiveMode]::Update)

function ReadEntry($name) {
  $entry = $zip.GetEntry($name)
  if (-not $entry) { return $null }
  $reader = New-Object System.IO.StreamReader($entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Close() }
}

function WriteEntry($name, $content) {
  $entry = $zip.GetEntry($name)
  if ($entry) { $entry.Delete() }
  $entry = $zip.CreateEntry($name)
  $stream = $entry.Open()
  $writer = New-Object System.IO.StreamWriter($stream, [System.Text.UTF8Encoding]::new($false))
  try { $writer.Write($content) } finally { $writer.Close() }
}

function ReplaceEntryFile($name, $filePath) {
  $entry = $zip.GetEntry($name)
  if ($entry) { $entry.Delete() }
  $entry = $zip.CreateEntry($name)
  $in = [System.IO.File]::OpenRead($filePath)
  $out = $entry.Open()
  try { $in.CopyTo($out) } finally { $out.Close(); $in.Close() }
}

function ParaText($pXml) {
  $texts = [regex]::Matches($pXml, '<w:t[^>]*>(.*?)</w:t>') | ForEach-Object { [System.Net.WebUtility]::HtmlDecode($_.Groups[1].Value) }
  return (($texts -join '') -replace '\s+', ' ').Trim()
}

function XmlEscape($value) {
  return [System.Security.SecurityElement]::Escape($value)
}

function MakePara($text, $refPara) {
  $pPr = ''
  $pPrMatch = [regex]::Match($refPara, '<w:pPr[\s\S]*?</w:pPr>')
  if ($pPrMatch.Success) { $pPr = $pPrMatch.Value }
  return '<w:p>' + $pPr + '<w:r><w:t>' + (XmlEscape $text) + '</w:t></w:r></w:p>'
}

function Emu($inches) {
  return [int64][math]::Round($inches * 914400)
}

function ReplaceParagraphByPredicate([ref]$docXmlRef, [scriptblock]$predicate, $newText) {
  $paragraphs = [regex]::Matches($docXmlRef.Value, '<w:p\b[\s\S]*?</w:p>')
  foreach ($p in $paragraphs) {
    $text = ParaText $p.Value
    if (& $predicate $text) {
      $docXmlRef.Value = $docXmlRef.Value.Replace($p.Value, (MakePara $newText $p.Value))
      return $true
    }
  }
  return $false
}

function InsertAfterParagraph([ref]$docXmlRef, [scriptblock]$predicate, $newText) {
  if ($docXmlRef.Value.Contains($newText)) { return $false }
  $paragraphs = [regex]::Matches($docXmlRef.Value, '<w:p\b[\s\S]*?</w:p>')
  foreach ($p in $paragraphs) {
    $text = ParaText $p.Value
    if (& $predicate $text) {
      $docXmlRef.Value = $docXmlRef.Value.Replace($p.Value, $p.Value + (MakePara $newText $p.Value))
      return $true
    }
  }
  return $false
}

function InsertBeforeParagraph([ref]$docXmlRef, [scriptblock]$predicate, $newText) {
  if ($docXmlRef.Value.Contains($newText)) { return $false }
  $paragraphs = [regex]::Matches($docXmlRef.Value, '<w:p\b[\s\S]*?</w:p>')
  foreach ($p in $paragraphs) {
    $text = ParaText $p.Value
    if (& $predicate $text) {
      $docXmlRef.Value = $docXmlRef.Value.Replace($p.Value, (MakePara $newText $p.Value) + $p.Value)
      return $true
    }
  }
  return $false
}

$docXml = ReadEntry 'word/document.xml'
$relsXml = ReadEntry 'word/_rels/document.xml.rels'
$rels = @{}
foreach ($m in [regex]::Matches($relsXml, '<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"')) {
  $rels[$m.Groups[1].Value] = $m.Groups[2].Value
}

$updatedImages = 0
$paragraphs = [regex]::Matches($docXml, '<w:p\b[\s\S]*?</w:p>')
for ($i = 0; $i -lt $paragraphs.Count; $i++) {
  $caption = ParaText $paragraphs[$i].Value
  $capMatch = [regex]::Match($caption, '^(Figure|FIGURE)\s*([0-9]+)\s+(?!shows\b)')
  if (-not $capMatch.Success) { continue }
  $fig = $capMatch.Groups[2].Value
  if (-not $imageMap.ContainsKey($fig)) { continue }

  $rid = $null
  $imageParaIndex = -1
  for ($j = $i - 1; $j -ge [Math]::Max(0, $i - 10); $j--) {
    $embedMatch = [regex]::Match($paragraphs[$j].Value, 'r:embed="([^"]+)"')
    if ($embedMatch.Success) {
      $rid = $embedMatch.Groups[1].Value
      $imageParaIndex = $j
      break
    }
  }
  if (-not $rid -or -not $rels.ContainsKey($rid)) { continue }

  $target = $rels[$rid]
  $sourceImage = Resolve-Path (Join-Path 'docs\images' $imageMap[$fig])
  ReplaceEntryFile ('word/' + $target) $sourceImage

  $img = [System.Drawing.Image]::FromFile($sourceImage)
  $pxW = [double]$img.Width
  $pxH = [double]$img.Height
  $img.Dispose()

  $maxW = 5.8
  $maxH = 8.25
  if ($fig -eq '26') {
    $displayW = 2.2
    $displayH = $displayW * ($pxH / $pxW)
  } else {
    $displayW = $maxW
    $displayH = $displayW * ($pxH / $pxW)
    if ($displayH -gt $maxH) {
      $displayH = $maxH
      $displayW = $displayH * ($pxW / $pxH)
    }
  }
  $cx = Emu $displayW
  $cy = Emu $displayH

  $oldPara = $paragraphs[$imageParaIndex].Value
  $newPara = $oldPara -replace '<wp:extent\b[^>]*/>', ('<wp:extent cx="' + $cx + '" cy="' + $cy + '"/>')
  $newPara = $newPara -replace '<a:ext\b[^>]*cx="[0-9]+"[^>]*cy="[0-9]+"[^>]*/>', ('<a:ext cx="' + $cx + '" cy="' + $cy + '"/>')
  $docXml = $docXml.Replace($oldPara, $newPara)
  $paragraphs = [regex]::Matches($docXml, '<w:p\b[\s\S]*?</w:p>')
  $updatedImages += 1
}

$changes = @()
$ref = [ref]$docXml
if (ReplaceParagraphByPredicate $ref { param($t) $t.StartsWith('The database is relational, modelled with Prisma') } 'The database is relational and is modelled through Prisma. Figure 6 redraws the main operational entities as an entity-relationship model rather than a raw database dump. It highlights the tables that carry the promotion workflow, the key foreign-key paths between them, and the audit records that make each application traceable. Auxiliary compatibility tables and general key-value settings are omitted so the diagram remains focused on the implemented promotion process.') { $changes += 'database paragraph' }
if (InsertAfterParagraph $ref { param($t) $t -eq '4.6 USE CASE MODEL' } 'Figure 8 presents the use case model using the standard UML convention: human actors are placed outside the system boundary, while the use cases supported by the Digital Staff Promotion Support System are placed inside the boundary. This distinction shows that lecturers, HODs or Deans, HR officers, committee reviewers, and system administrators interact with the system, while the system owns the application, verification, eligibility, reporting, and audit functions.') { $changes += 'use case paragraph' }
if (ReplaceParagraphByPredicate $ref { param($t) $t.StartsWith('Figure 9 shows the complete cross-role process') } 'Figure 9 presents the complete cross-role activity flow from lecturer submission through to a recorded institutional decision. It preserves the main exception paths: missing evidence returns to the lecturer, incomplete academic review returns for correction, failed HR verification requests correction, and committee further-review decisions route back for HR action.') { $changes += 'activity paragraph' }
if (InsertBeforeParagraph $ref { param($t) $t -eq 'Figure 15 Eligibility Calculation Sequence Diagram' } 'Figure 15 separates the eligibility calculation into the actors and services that participate in the implemented request. HR initiates the calculation after evidence verification, the API validates the request, the workflow service loads and persists the application state, the eligibility engine applies configured criteria to verified documents only, and the audit and notification layer records the outcome for traceability.') { $changes += 'eligibility sequence paragraph' }
if (ReplaceParagraphByPredicate $ref { param($t) $t.StartsWith('The lecturer-facing pages implement the application-creation') } 'The lecturer-facing pages implement the application-creation and evidence-upload activity shown in Figure 10: profile completion, rank selection, per-category evidence upload, submission, and status tracking through to the final recommendation. The screenshots in this section were refreshed from the running application with populated workflow records, so the displayed queues and detail pages demonstrate live system behaviour rather than empty layouts.') { $changes += 'screenshots paragraph' }
if (InsertAfterParagraph $ref { param($t) $t.StartsWith('The project also demonstrates, concretely, why testing a running system matters') } 'A further conclusion from the implementation is that the strongest value of the system is not only the eligibility score, but the structure it gives to the promotion process. By separating application submission, departmental academic review, HR evidence verification, committee recommendation, authority approval, and final close-out into distinct logged stages, the system reduces ambiguity about responsibility. This separation is important in a university context because promotion decisions involve both administrative completeness and academic judgement; the implemented system supports both by preserving evidence, comments, status history, and audit records without pretending that a software score can replace the statutory review bodies.') { $changes += 'chapter 5 conclusion paragraph' }
$docXml = $ref.Value

$docXml = [regex]::Replace($docXml, '<w:commentRangeStart\b[^>]*/>', '')
$docXml = [regex]::Replace($docXml, '<w:commentRangeEnd\b[^>]*/>', '')
$docXml = [regex]::Replace($docXml, '<w:r\b[^>]*>(?:(?!</w:r>)[\s\S])*?<w:commentReference\b(?:(?!</w:r>)[\s\S])*</w:r>', '')
WriteEntry 'word/document.xml' $docXml

$commentsXml = ReadEntry 'word/comments.xml'
if ($commentsXml) {
  $commentsXml = [regex]::Replace($commentsXml, '<w:comment\b[\s\S]*?</w:comment>', '')
  WriteEntry 'word/comments.xml' $commentsXml
}

$zip.Dispose()
Write-Output "Created: $output"
Write-Output "UPDATED_IMAGES=$updatedImages"
Write-Output "TEXT_CHANGES=$($changes -join ', ')"
