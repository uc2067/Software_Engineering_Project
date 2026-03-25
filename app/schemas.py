from typing import Optional
from pydantic import BaseModel


class ProfileCreate(BaseModel):
    user_id: int
    full_name: Optional[str] = ""
    email: Optional[str] = ""
    role_title: Optional[str] = ""
    department: Optional[str] = ""
    bio: Optional[str] = ""
    skills: Optional[str] = ""
    interests: Optional[str] = ""
    experience_level: Optional[str] = ""
    github_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    current_workload: Optional[int] = 0
    capacity: Optional[int] = 5
    availability_status: Optional[str] = ""


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str]
    email: Optional[str]
    role_title: Optional[str]
    department: Optional[str]
    bio: Optional[str]
    skills: Optional[str]
    interests: Optional[str]
    experience_level: Optional[str]
    github_url: Optional[str]
    linkedin_url: Optional[str]
    current_workload: Optional[int]
    capacity: Optional[int]
    availability_status: Optional[str]

    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    required_skills: Optional[str]
    assignee_id: Optional[int]
    sprint_id: Optional[int]

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    todo: int
    in_progress: int
    done: int
    completion_percentage: float
    workload: dict


class UserResponse(BaseModel):
    id: int
    name: str
    role: str

class UserCreate(BaseModel):
    name: str
    role: str


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    required_skills: Optional[str] = ""
    status: Optional[str] = "To Do"
    assignee_id: Optional[int] = None

    class Config:
        from_attributes = True