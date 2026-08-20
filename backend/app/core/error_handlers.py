import logging
import traceback
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.exceptions import AppException

# Import settings to check DEBUG mode for showing tracebacks
try:
    from app.config import settings
except ImportError:
    class DummySettings:
        DEBUG = False
    settings = DummySettings()

logger = logging.getLogger(__name__)

from fastapi.encoders import jsonable_encoder

def register_error_handlers(app: FastAPI) -> None:

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": exc.error_code,
                "status_code": exc.status_code
            },
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=jsonable_encoder({
                "detail": exc.errors(),
                "error_code": "VALIDATION_ERROR",
                "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY
            })
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        content = {
            "detail": "Internal server error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR
        }
        
        if getattr(settings, "DEBUG", False):
            content["detail"] = str(exc)
            content["traceback"] = traceback.format_exc()
            
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=content
        )
