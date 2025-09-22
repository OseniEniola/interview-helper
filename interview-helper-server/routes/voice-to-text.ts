// transcriptionRouter.ts
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Helper: process base64 in chunks
function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
   const chunks: Uint8Array[] = [];
   let position = 0;

   while (position < base64String.length) {
      const chunk = base64String.slice(position, position + chunkSize);
      const binaryChunk = Buffer.from(chunk, "base64");
      chunks.push(binaryChunk);
      position += chunkSize;
   }

   const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
   const result = new Uint8Array(totalLength);
   let offset = 0;

   for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
   }

   return result;
}

export const transcribeAudioToText = async (filePath: string) => {
   try {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      //formData.append("file", fs.createReadStream(filePath), { filename: "audio.webm", contentType: "audio/webm" });

      // Read file into a buffer and wrap it as a Blob
      const buffer = fs.readFileSync(filePath);
      const blob = new Blob([buffer], { type: "audio/webm" });

      formData.append("file", blob, path.basename(filePath));
      formData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
         method: "POST",
         headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            // ...formData.getHeaders(),
         },
         body: formData,
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`OpenAI API error: ${errorText}`);
      }

      const result: any = await response.json();
      return result.text;
   } catch (error: any) {
      console.error("Voice-to-text error:", error.message);
      throw error;
   }
};

/* router.post("/", async (req: Request, res: Response) => {
   try {
      const { audio } = req.body;
      if (!audio) throw new Error("No audio data provided");

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

      console.log("Processing audio transcription...");

      const binaryAudio = processBase64Chunks(audio);

      const formData = new FormData();
      formData.append("file", Buffer.from(binaryAudio), { filename: "audio.webm", contentType: "audio/webm" });
      formData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
         method: "POST",
         headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
         },
         body: formData as any, // Type casting to satisfy node-fetch types
      });

      if (!response.ok) {
         const errorText = await response.text();
         console.error("OpenAI API error:", errorText);
         throw new Error(`OpenAI API error: ${errorText}`);
      }

      const result: any = await response.json();
      console.log("Transcription successful:", result.text);

      return res.json({ text: result.text });
   } catch (error: any) {
      console.error("Voice-to-text error:", error);
      return res.status(500).json({ error: error.message });
   }
}); */

export default router;
