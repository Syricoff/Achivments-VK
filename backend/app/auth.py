import base64
import hashlib
import hmac
from urllib.parse import parse_qsl, urlencode
from typing import Optional, Dict
from fastapi import Header, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

def verify_vk_sign(query_string: str, secret: str) -> bool:
    """
    Validates VK launch params signature using HMAC-SHA256 according to official VK Mini Apps documentation.
    """
    if not query_string:
        return False

    parsed = dict(parse_qsl(query_string, keep_blank_values=True))
    if "sign" not in parsed:
        return False

    client_sign = parsed.pop("sign")
    
    # Keep only params starting with 'vk_'
    vk_params = {k: v for k, v in parsed.items() if k.startswith("vk_")}
    sorted_params = sorted(vk_params.items(), key=lambda x: x[0])
    query_to_sign = urlencode(sorted_params)

    # Compute HMAC-SHA256
    hash_bytes = hmac.new(
        secret.encode("utf-8"),
        query_to_sign.encode("utf-8"),
        hashlib.sha256
    ).digest()

    expected_sign = base64.b64encode(hash_bytes).decode("utf-8")
    expected_sign = expected_sign.replace("+", "-").replace("/", "_").rstrip("=")

    return hmac.compare_digest(client_sign, expected_sign)

def parse_vk_params(param_str: str) -> Dict[str, str]:
    if not param_str:
        return {}
    if param_str.startswith("Bearer "):
        param_str = param_str[7:]
    if param_str.startswith("?"):
        param_str = param_str[1:]
    return dict(parse_qsl(param_str, keep_blank_values=True))

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_vk_sign: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts VK user info from Authorization header or test fallback.
    In development mode, allows automatic mock fallback if no VK header is present.
    """
    params_str = authorization or x_vk_sign or ""
    params = parse_vk_params(params_str)
    
    vk_user_id = params.get("vk_user_id")
    group_role = params.get("vk_viewer_group_role", "none")

    # If in dev or test and no auth header, fallback to mock demo user
    if not vk_user_id:
        if settings.ENV == "development" or settings.DEBUG:
            vk_user_id = "10001"
            group_role = "admin" # Allow admin testing in local dev
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing VK authentication parameters"
            )

    try:
        vk_id_int = int(vk_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vk_user_id"
        )

    # Check admin status
    is_admin = (
        group_role in ["admin", "editor", "moderator"] or 
        vk_id_int in settings.ADMIN_VK_IDS
    )
    role = "ADMIN" if is_admin else "USER"

    user = db.query(User).filter(User.vk_id == vk_id_int).first()
    if not user:
        user = User(
            vk_id=vk_id_int,
            first_name=params.get("first_name", "Участник"),
            last_name=params.get("last_name", "Лагеря"),
            avatar_url=params.get("avatar_url", None),
            role=role,
            rating_points=0,
            spendable_points=0,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.role != role:
            user.role = role
            db.commit()
            db.refresh(user)

    return user

def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user
