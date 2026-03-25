from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import User, DeveloperProfile, Task
from .schemas import (
    ProfileCreate,
    ProfileResponse,
    TaskResponse,
    DashboardResponse,
    UserResponse,
    UserCreate,
    TaskCreate,
    UserLogin,
    UserRegister,
    Token,
)
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_from_request,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from .seed import seed_data

app = FastAPI(title="IntelliTrack Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
seed_data()


@app.get("/")
def root():
    return {"message": "IntelliTrack backend is running"}


# Authentication endpoints
@app.post("/auth/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role or "Developer",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "user_name": new_user.name,
        "user_role": new_user.role,
    }


@app.post("/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token."""
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "user_name": user.name,
        "user_role": user.role,
    }


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_endpoint(
    current_user: User = Depends(get_current_user_from_request),
):
    """Get current authenticated user."""
    return current_user


@app.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return tasks


@app.get("/profiles", response_model=list[ProfileResponse])
def get_profiles(db: Session = Depends(get_db)):
    return db.query(DeveloperProfile).all()


@app.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    profile = (
        db.query(DeveloperProfile)
        .filter(DeveloperProfile.user_id == user_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@app.post("/profile", response_model=ProfileResponse)
def create_or_update_profile(profile: ProfileCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(DeveloperProfile)
        .filter(DeveloperProfile.user_id == profile.user_id)
        .first()
    )

    if existing:
        existing.full_name = profile.full_name
        existing.email = profile.email
        existing.role_title = profile.role_title
        existing.department = profile.department
        existing.bio = profile.bio
        existing.skills = profile.skills
        existing.interests = profile.interests
        existing.experience_level = profile.experience_level
        existing.github_url = profile.github_url
        existing.linkedin_url = profile.linkedin_url
        existing.current_workload = profile.current_workload
        existing.capacity = profile.capacity
        existing.availability_status = profile.availability_status

        db.commit()
        db.refresh(existing)
        return existing

    new_profile = DeveloperProfile(
        user_id=profile.user_id,
        full_name=profile.full_name,
        email=profile.email,
        role_title=profile.role_title,
        department=profile.department,
        bio=profile.bio,
        skills=profile.skills,
        interests=profile.interests,
        experience_level=profile.experience_level,
        github_url=profile.github_url,
        linkedin_url=profile.linkedin_url,
        current_workload=profile.current_workload,
        capacity=profile.capacity,
        availability_status=profile.availability_status,
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()

    todo = sum(1 for t in tasks if t.status == "To Do")
    in_progress = sum(1 for t in tasks if t.status == "In Progress")
    done = sum(1 for t in tasks if t.status == "Done")

    total = len(tasks)
    completion_percentage = round((done / total) * 100, 2) if total > 0 else 0.0

    workload = {}
    for task in tasks:
        assignee_name = task.assignee.name if task.assignee else "Unassigned"
        workload[assignee_name] = workload.get(assignee_name, 0) + 1

    return {
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "completion_percentage": completion_percentage,
        "workload": workload,
    }

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_password = hash_password(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        description=task.description,
        required_skills=task.required_skills,
        status=task.status,
        assignee_id=task.assignee_id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.put("/tasks/{task_id}/assign/{user_id}")
def assign_task(task_id: int, user_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    user = db.query(User).filter(User.id == user_id).first()

    if not task or not user:
        raise HTTPException(status_code=404, detail="Task or User not found")

    task.assignee_id = user_id
    task.status = "In Progress"

    db.commit()
    return {"message": "Task assigned successfully"}