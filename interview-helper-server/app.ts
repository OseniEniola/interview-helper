import createError from 'http-errors';
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';

// Import routers (assume these are TS files exporting default router)
//import indexRouter from './routes/index';
//import usersRouter from './routes/users';
import generateQuestionsRouter from './routes/generate-questions';
import interviewChatRouter from './routes/interview-chat';
import realtimeTokenRouter from './routes/realtime-token';
import voiceToTextRouter from './routes/voice-to-text';
import authRouter from './routes/auth';
import interviewSessionRouter from './routes/interview-sessions';
import { setupSwagger } from './utilities/swagger';

const app = express();

import dotenv from "dotenv";
dotenv.config();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Setup Swagger
setupSwagger(app);

// middleware
app.use(
  cors({
    origin: ["http://localhost:8080","http://13.217.253.74:8080/"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(logger('dev') as unknown as RequestHandler);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser() as unknown as RequestHandler);
app.use(express.static(path.join(__dirname, 'public')));

// routes
//app.use('/', indexRouter);
//app.use('/users', usersRouter);
app.use('/api/auth',authRouter)   
app.use('/api/interview-sessions', interviewSessionRouter);
app.use('/api/generate-questions', generateQuestionsRouter);
app.use('/api/interview-chat', interviewChatRouter);
app.use('/api/realtime-token', realtimeTokenRouter);
app.use('/api/voice-to-text', voiceToTextRouter);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
