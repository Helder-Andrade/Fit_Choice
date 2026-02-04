// result-wrapper.dto.ts
export class ServiceResponse<T> {
  success: boolean;
  message?: string;
  payload?: T;

  constructor(success: boolean, payload?: T, message?: string) {
    this.success = success;
    this.payload = payload;
    this.message = message;
  }
}