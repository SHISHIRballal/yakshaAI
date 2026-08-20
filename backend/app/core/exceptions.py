from typing import Any, Dict, Optional

class AppException(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        self.headers = headers
        super().__init__(detail)

class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource", detail: Optional[str] = None):
        super().__init__(
            status_code=404,
            detail=detail or f"{resource} not found",
            error_code="NOT_FOUND",
        )

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=403, detail=detail, error_code="FORBIDDEN")

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized", headers: Optional[Dict[str, str]] = None):
        super().__init__(
            status_code=401,
            detail=detail,
            error_code="UNAUTHORIZED",
            headers=headers or {"WWW-Authenticate": "Bearer"},
        )

class ConflictException(AppException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status_code=409, detail=detail, error_code="CONFLICT")

class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad Request"):
        super().__init__(status_code=400, detail=detail, error_code="BAD_REQUEST")

class ValidationException(AppException):
    def __init__(self, detail: str = "Validation Error"):
        super().__init__(status_code=422, detail=detail, error_code="VALIDATION_ERROR")
