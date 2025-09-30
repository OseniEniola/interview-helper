import multer from "multer";
import path from "path";
import fs from "fs";
import { NextFunction } from "express";

export const dynamicResumeUpload = (folderParam: string) => {
   const storage = multer.diskStorage({
      destination: (req, file, cb) => {
         // Default to "uploads/resumes" if no param is passed
         const targetFolder = path.join(process.cwd(), folderParam || "uploads/resumes");
        // const targetFolder = folderParam || "uploads/resumes";

         // Ensure folder exists
         if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
         }

         cb(null, targetFolder);
      },
      filename: (req, file, cb) => {
         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
         cb(null, uniqueSuffix + path.extname(file.originalname));
      },
   });

   const fileFilter = (req: any, file: any, cb: any) => {
      const allowedTypes = /pdf|doc|docx/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
         cb(null, true);
      } else {
         cb(new Error("Only PDF, DOC, or DOCX files are allowed"));
      }
   };

   return multer({ storage, fileFilter });
};

export const createUploadMiddleware = (prefix: string = "") => {
  return (req: any, res: any, next: any) => {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const { session_id } = req.body;

        if (!session_id) {
          return cb(new Error("session_id is required"), "");
        }
          // ✅ Always resolve relative to project root, not dist/
        const uploadPath = path.join(
          process.cwd(),
          "uploads",
          "interviews",
          session_id
        );

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath)
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const uniqueSuffix =
          Date.now() + "-" + Math.round(Math.random() * 1e9);
        const finalName = prefix
          ? `${prefix}_${baseName}_${uniqueSuffix}${ext}`
          : `${baseName}_${uniqueSuffix}${ext}`;
        cb(null, finalName);
      },
    });

    // reject request if no file
    const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
      if (!file) {
        return cb(new Error("File is required"), false);
      }
      cb(null, true);
    };

    const upload = multer({ storage, fileFilter }).single("answer");

    upload(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      next();
    });
  };
};
