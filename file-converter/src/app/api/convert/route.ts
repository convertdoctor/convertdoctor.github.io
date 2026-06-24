import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import Tesseract from "tesseract.js";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import os from "os";
import JSZip from "jszip";

async function cleanDocxFonts(docxBuffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(docxBuffer);
  
  const filesToClean = ["word/document.xml", "word/styles.xml", "word/fontTable.xml"];
  
  for (const fileName of filesToClean) {
    if (zip.file(fileName)) {
      let xml = await zip.file(fileName)!.async("string");
      
      // 1. Remove PDF subset prefixes (e.g., "ABCDEF+FontName" -> "FontName")
      // and remove suffixes like "-Regular", "-Bold" from the font name attribute
      xml = xml.replace(/w:([a-zA-Z]+)="[A-Z]{6}\+([^"-]+)(-[^"]*)?"/g, 'w:$1="$2"');
      
      // 2. Fix specific known UI fonts missing spaces
      xml = xml.replace(/NirmalaUI/g, "Nirmala UI");
      xml = xml.replace(/TimesNewRoman/g, "Times New Roman");
      xml = xml.replace(/CourierNew/g, "Courier New");
      xml = xml.replace(/ArialMT/g, "Arial");
      
      zip.file(fileName, xml);
    }
  }

  return await zip.generateAsync({ type: "nodebuffer" });
}

async function runPowerShell(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ps = spawn("powershell", ["-ExecutionPolicy", "Bypass", "-File", scriptPath], {
      detached: false,
      stdio: 'ignore', // Crucial to prevent hanging on inherited COM handles!
      windowsHide: true
    });
    
    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`PowerShell exited with code ${code}`));
    });
  });
}

async function convertPdfToDocxNative(inputBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const inputId = Date.now().toString() + Math.floor(Math.random() * 1000);
  const inputPath = path.join(tempDir, `input-${inputId}.pdf`);
  const outputPath = path.join(tempDir, `output-${inputId}.docx`);

  fs.writeFileSync(inputPath, inputBuffer);

  const wrapperScript = path.join(process.cwd(), "node_modules", "pdf2docx-wasm", "run-conversion.mjs");
  const moduleDir = path.join(process.cwd(), "node_modules", "pdf2docx-wasm");

  try {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);
    
    // Run the wrapper inside the module directory to avoid Pyodide path bugs
    await execAsync(`node run-conversion.mjs "${inputPath}" "${outputPath}"`, { cwd: moduleDir });
    
    let docxBuffer = fs.readFileSync(outputPath);
    // Post-process the generated DOCX to fix any corrupted/subsetted font names (e.g. Nirmala UI)
    docxBuffer = Buffer.from(await cleanDocxFonts(docxBuffer));
    
    return docxBuffer;
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
  }
}

async function convertPdfToSearchablePdf(inputBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const inputId = Date.now().toString() + Math.floor(Math.random() * 1000);
  const inputPath = path.join(tempDir, `input-${inputId}.pdf`);
  const outputPath = path.join(tempDir, `output-${inputId}.pdf`);

  fs.writeFileSync(inputPath, inputBuffer);

  const moduleDir = path.join(process.cwd(), "node_modules", "pdf2docx-wasm");

  try {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);
    
    // Process OCR via isolated Node script
    const { stdout } = await execAsync(`node run-pdf-ocr.mjs "${inputPath}" "${outputPath}"`, { cwd: moduleDir });
    
    if (!fs.existsSync(outputPath)) {
      throw new Error("Failed to generate searchable PDF");
    }
    
    const finalPdfBytes = fs.readFileSync(outputPath);
    return Buffer.from(finalPdfBytes);
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
  }
}

async function convertPdfToJpgNative(inputBuffer: Buffer): Promise<{buffer: Buffer, ext: string, mimeType: string}> {
  const tempDir = os.tmpdir();
  const inputId = Date.now().toString() + Math.floor(Math.random() * 1000);
  const inputPath = path.join(tempDir, `input-${inputId}.pdf`);
  const outputPath = path.join(tempDir, `output-${inputId}.bin`);
  const metaPath = path.join(tempDir, `meta-${inputId}.txt`);

  fs.writeFileSync(inputPath, inputBuffer);

  const moduleDir = path.join(process.cwd(), "node_modules", "pdf2docx-wasm");

  try {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);
    
    // Run the jpg extraction wrapper
    await execAsync(`node run-pdf2jpg.mjs "${inputPath}" "${outputPath}" "${metaPath}"`, { cwd: moduleDir });
    
    const jpgBuffer = fs.readFileSync(outputPath);
    const metaType = fs.readFileSync(metaPath, "utf8").trim();
    
    if (metaType === "zip") {
      return { buffer: jpgBuffer, ext: ".zip", mimeType: "application/zip" };
    } else {
      return { buffer: jpgBuffer, ext: ".jpg", mimeType: "image/jpeg" };
    }
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
    try { fs.unlinkSync(metaPath); } catch (e) {}
  }
}

async function convertDocxToPdfWindows(inputBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const inputId = Date.now().toString() + Math.floor(Math.random() * 1000);
  const inputPath = path.join(tempDir, `input-${inputId}.docx`);
  const outputPath = path.join(tempDir, `output-${inputId}.pdf`);

  fs.writeFileSync(inputPath, inputBuffer);

  const psScript = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open('${inputPath}')
  $doc.SaveAs([ref] '${outputPath}', [ref] 17)
  $doc.Close()
} finally {
  $word.Quit()
}
  `;

  const scriptPath = path.join(tempDir, `script-docx2pdf-${inputId}.ps1`);
  fs.writeFileSync(scriptPath, psScript);

  try {
    await runPowerShell(scriptPath);
    const pdfBuffer = fs.readFileSync(outputPath);
    return pdfBuffer;
  } finally {
    try { fs.unlinkSync(inputPath); } catch (e) {}
    try { fs.unlinkSync(outputPath); } catch (e) {}
    try { fs.unlinkSync(scriptPath); } catch (e) {}
  }
}

async function convertDocxToXlsx(inputBuffer: Buffer): Promise<Buffer> {
  const xlsx = require('xlsx');

  // Convert DOCX to HTML
  const { value: htmlText } = await mammoth.convertToHtml({ buffer: inputBuffer });

  let wb;
  if (htmlText.includes('<table')) {
    // If tables exist, xlsx can parse HTML tables directly
    wb = xlsx.read(htmlText, { type: 'string' });
  } else {
    // Fallback: extract raw text and split by newlines
    const { value: rawText } = await mammoth.extractRawText({ buffer: inputBuffer });
    const lines = rawText.split('\n').filter(line => line.trim().length > 0).map(line => [line]);
    
    wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet(lines.length > 0 ? lines : [["No text found"]]);
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  }

  // Write to buffer
  const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  return excelBuffer;
}

async function convertDocxToPptx(inputBuffer: Buffer): Promise<Buffer> {
  const PptxGenJS = require('pptxgenjs');
  const cheerio = require('cheerio');
  const pptx = new PptxGenJS();
  
  // Extract HTML with embedded base64 images
  const { value: html } = await mammoth.convertToHtml({ buffer: inputBuffer });
  const $ = cheerio.load(html);
  const elements = $('body').children();
  
  if (elements.length === 0) {
    const slide = pptx.addSlide();
    slide.addText("No content found in document", { x: 1, y: 1, fontSize: 18, align: "center", w: "80%", h: "80%" });
  } else {
    elements.each((i: number, el: any) => {
      const htmlTag = $(el);
      const img = htmlTag.find('img');
      const text = htmlTag.text().trim();
      
      if (img.length > 0 || text.length > 0) {
        const slide = pptx.addSlide();
        
        if (img.length > 0) {
          // If image exists, add it to the center
          const src = img.attr('src');
          if (src) {
            slide.addImage({ data: src, x: "10%", y: "10%", w: "80%", h: "80%", sizing: { type: "contain" } });
          }
          // If there is also text in this paragraph, put it below the image
          if (text) {
            slide.addText(text, { x: 0, y: "90%", w: "100%", align: "center", fontSize: 14 });
          }
        } else {
          // Text only slide
          slide.addText(text, { 
            x: "5%", y: "10%", w: "90%", h: "80%", 
            fontSize: 24, align: "center", valign: "middle", wrap: true 
          });
        }
      }
    });
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return buffer as Buffer;
}

function parsePdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser(null, 1);
    
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
    });
    
    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const conversionType = formData.get("conversionType") as string;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const featureKeyMap: Record<string, string> = {
      "pdf-to-word": "FEATURE_PDF_TO_WORD",
      "word-to-pdf": "FEATURE_WORD_TO_PDF",
      "pdf-to-jpg": "FEATURE_PDF_TO_JPG",
      "pdf-ocr": "FEATURE_PDF_OCR",
      "word-to-excel": "FEATURE_WORD_TO_EXCEL",
      "word-to-ppt": "FEATURE_WORD_TO_PPT",
      "pdf-extract-text": "FEATURE_PDF_EDITOR"
    };

    const settingKey = featureKeyMap[conversionType];
    if (settingKey) {
      const setting = await prisma.systemSetting.findUnique({ where: { key: settingKey } });
      if (setting && setting.value === "DISABLED") {
        return NextResponse.json({ message: "This feature has been disabled by the administrator." }, { status: 403 });
      }
    }

    const buffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);
    
    let resultBuffer: Uint8Array | Buffer;
    let mimeType = "application/octet-stream";
    let ext = ".bin";

    if (conversionType === "pdf-to-word") {
      // Execute local PyMuPDF layout reconstruction engine via WASM
      resultBuffer = await convertPdfToDocxNative(nodeBuffer);
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      ext = ".docx";

    } else if (conversionType === "word-to-pdf") {
      if (process.platform === 'win32') {
        // Use MS Word COM for perfect layout
        resultBuffer = await convertDocxToPdfWindows(nodeBuffer);
        mimeType = "application/pdf";
        ext = ".pdf";
      } else {
        // 1. Extract HTML from DOCX
        const { value: htmlText } = await mammoth.convertToHtml({ buffer: nodeBuffer });

        // 2. Return HTML to the client for client-side PDF rendering
        return NextResponse.json({
          type: 'html2pdf',
          html: htmlText
        }, { status: 200 });
      }

    } else if (conversionType === "pdf-ocr") {
      resultBuffer = await convertPdfToSearchablePdf(nodeBuffer);
      mimeType = "application/pdf";
      ext = "-ocr.pdf";

    } else if (conversionType === "pdf-to-jpg") {
      const result = await convertPdfToJpgNative(nodeBuffer);
      resultBuffer = result.buffer;
      mimeType = result.mimeType;
      ext = result.ext;

    } else if (conversionType === "word-to-excel") {
      resultBuffer = await convertDocxToXlsx(nodeBuffer);
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      ext = ".xlsx";

    } else if (conversionType === "word-to-ppt") {
      resultBuffer = await convertDocxToPptx(nodeBuffer);
      mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      ext = ".pptx";

    } else if (conversionType === "pdf-extract-text") {
      let text = await parsePdfText(nodeBuffer);
      // If the PDF is scanned, the extracted text will be very short or empty.
      // We seamlessly run OCR to generate a searchable PDF and then extract the text.
      if (!text || text.trim().length < 50) {
        const ocrPdfBuffer = await convertPdfToSearchablePdf(nodeBuffer);
        text = await parsePdfText(ocrPdfBuffer);
      }
      return NextResponse.json({ text }, { status: 200 });

    } else {
      // Fallback
      resultBuffer = new Uint8Array(buffer);
    }

    const finalBuffer = Buffer.isBuffer(resultBuffer) ? resultBuffer : Buffer.from(resultBuffer);

    return new NextResponse(finalBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="converted-${file.name.replace(/\.[^/.]+$/, "")}${ext}"`
      }
    });

  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json({ message: "An error occurred during conversion" }, { status: 500 });
  }
}
