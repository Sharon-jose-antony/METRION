from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.models import User, UserRole, Organization, OrgType
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse, RefreshTokenRequest
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Handle organization creation or lookup
    org = None
    if user_in.organization_name:
        org = db.query(Organization).filter(Organization.name == user_in.organization_name).first()
        if not org:
            org = Organization(
                name=user_in.organization_name,
                org_type=OrgType.BUSINESS if user_in.role == UserRole.INSTRUMENT_OWNER else OrgType.LMO_OFFICE,
                state=user_in.state or "Delhi",
                district=user_in.district or "Central Delhi"
            )
            db.add(org)
            db.commit()
            db.refresh(org)

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role,
        organization_id=org.id if org else None,
        designation=user_in.designation,
        jurisdiction_state=user_in.state,
        jurisdiction_district=user_in.district,
        is_active=True,
        is_demo=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action="USER_REGISTERED",
        description=f"New user registered: {new_user.email} as {new_user.role.value}",
        user=new_user,
        entity_type="USER",
        entity_id=str(new_user.id)
    )

    access_token = create_access_token(new_user.id)
    refresh_token = create_refresh_token(new_user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role.value,
            "organization_name": org.name if org else None,
            "state": new_user.jurisdiction_state,
            "district": new_user.jurisdiction_district
        }
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated."
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        description=f"User {user.email} logged in successfully.",
        user=user,
        entity_type="USER",
        entity_id=str(user.id)
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "organization_name": user.organization.name if user.organization else None,
            "state": user.jurisdiction_state,
            "district": user.jurisdiction_district
        }
    }

@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(refresh_in: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(refresh_in.refresh_token, settings.REFRESH_SECRET_KEY)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "organization_name": user.organization.name if user.organization else None,
            "state": user.jurisdiction_state,
            "district": user.jurisdiction_district
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit_event(
        db=db,
        action="LOGOUT",
        description=f"User {current_user.email} logged out.",
        user=current_user,
        entity_type="USER",
        entity_id=str(current_user.id)
    )
    return {"message": "Logged out successfully."}
