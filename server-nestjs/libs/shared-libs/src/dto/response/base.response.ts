export class BaseResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(success: boolean, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(data?: T, message = 'Success'): BaseResponse<T> {
    return new BaseResponse(true, message, data);
  }

  static error<T>(message: string, data?: T): BaseResponse<T> {
    return new BaseResponse(false, message, data);
  }
}
