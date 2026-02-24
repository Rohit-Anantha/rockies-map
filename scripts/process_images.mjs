import fs from "fs/promises";
import path from "path";
import exifr from "exifr";
import sharp from "sharp";

const INPUT_DIR = "./public/photos/raw"; // Put your heavy iPhone photos here
const OUTPUT_DIR = "./public/photos/display"; // This is where the web-ready photos go
const DATA_FILE = "./app/data/photos.json";
const START_DATE = new Date("2025-05-17T00:00:00");

async function processImages() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const files = await fs.readdir(INPUT_DIR);
  const imageFiles = files.filter((f) => /\.(jpe?g|png|heic|webp)$/i.test(f));

  const manifest = [];

  for (const file of imageFiles) {
    console.log(`📸 Processing ${file}...`);
    const inputPath = path.join(INPUT_DIR, file);
    const outputFileName = file.replace(/\.[^/.]+$/, "") + ".webp";
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    // 1. Extract EXIF with 'true' for 'translate', which handles the +/- signs
    const output = await exifr.parse(inputPath, {
      pick: [
        "GPSLatitude",
        "GPSLongitude",
        "GPSLatitudeRef",
        "GPSLongitudeRef",
        "DateTimeOriginal",
      ],
      translateValues: true, // This ensures West/South are converted to negative numbers
    });

    if (!output || output.latitude === undefined) {
      console.warn(`⚠️ No GPS data for ${file}, skipping.`);
      continue;
    }

    // Double check: if exifr didn't flip the sign, do it manually
    let lng = output.longitude;
    let lat = output.latitude;

    if (output.GPSLongitudeRef === "W" && lng > 0) lng = -lng;
    if (output.GPSLatitudeRef === "S" && lat > 0) lat = -lat;

    // 2. Calculate Day
    const photoDate = new Date(output.DateTimeOriginal || Date.now());
    const diffTime =
      photoDate.setHours(0, 0, 0, 0) - START_DATE.setHours(0, 0, 0, 0);
    const day = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 3. Optimize Image (Resize to 1200px wide, convert to WebP)
    await sharp(inputPath)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    manifest.push({
      id: outputFileName.split(".")[0],
      day: String(day),
      coordinates: [output.longitude, output.latitude],
      url: `/photos/display/${outputFileName}`,
      caption: file,
    });
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(manifest, null, 2));
  console.log(`✅ Success! ${manifest.length} photos processed.`);
}

processImages();
