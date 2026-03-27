import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    // message
    const message = (() => {
      if (typeof exceptionResponse === 'string') return exceptionResponse;
      if (exceptionResponse && typeof exceptionResponse === 'object') {
        const anyRes: any = exceptionResponse;
        // Nest default: { message, error, statusCode }
        if (Array.isArray(anyRes.message)) return anyRes.message.join(', ');
        if (typeof anyRes.message === 'string') return anyRes.message;
      }
      if (exception && typeof exception === 'object' && 'message' in exception) {
        return String((exception as any).message);
      }
      return 'Internal server error';
    })();

    // stack
    const stack =
      exception && typeof exception === 'object' && 'stack' in exception
        ? String((exception as any).stack)
        : undefined;

    // Logs exploitables
    this.logger.error(
      {
        status,
        message,
        path: request?.url,
        method: request?.method,
        exceptionResponse,
        stack,
      } as any,
      'Unhandled exception',
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request?.url,
      timestamp: new Date().toISOString(),
    });
  }
}
