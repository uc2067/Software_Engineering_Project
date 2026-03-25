from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    new_user = User(name=user.name, role=user.role)
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