from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Developer")

    profile = relationship("DeveloperProfile", back_populates="user", uselist=False)
    tasks = relationship("Task", back_populates="assignee")


class DeveloperProfile(Base):
    __tablename__ = "developer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    role_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    skills = Column(Text, nullable=True)
    interests = Column(Text, nullable=True)
    experience_level = Column(String, nullable=True)

    github_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    current_workload = Column(Integer, default=0)
    capacity = Column(Integer, default=5)
    availability_status = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    goal = Column(Text, nullable=True)

    tasks = relationship("Task", back_populates="sprint")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="To Do")
    required_skills = Column(Text, nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"), nullable=True)

    assignee = relationship("User", back_populates="tasks")
    sprint = relationship("Sprint", back_populates="tasks")