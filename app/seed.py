from .database import SessionLocal, engine, Base
from .models import User, DeveloperProfile, Sprint, Task


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing_user = db.query(User).first()
    if existing_user:
        db.close()
        return

    u1 = User(name="Alice", role="Developer")
    u2 = User(name="Bob", role="Developer")
    u3 = User(name="Charlie", role="Scrum Master")
    db.add_all([u1, u2, u3])
    db.commit()

    db.refresh(u1)
    db.refresh(u2)
    db.refresh(u3)

    p1 = DeveloperProfile(
        user_id=u1.id,
        full_name="Alice Johnson",
        email="alice@example.com",
        role_title="Backend Developer",
        department="Engineering",
        bio="Backend-focused developer with interest in APIs and AI systems.",
        skills="Python,FastAPI,SQL,React",
        interests="AI,Backend,System Design",
        experience_level="Intermediate",
        github_url="https://github.com/alice",
        linkedin_url="https://linkedin.com/in/alice",
        current_workload=2,
        capacity=5,
        availability_status="Available",
    )

    p2 = DeveloperProfile(
        user_id=u2.id,
        full_name="Bob Smith",
        email="bob@example.com",
        role_title="Frontend Developer",
        department="Engineering",
        bio="Frontend developer passionate about UI, usability, and dashboards.",
        skills="JavaScript,React,Node,CSS",
        interests="Frontend,UI,UX",
        experience_level="Beginner",
        github_url="https://github.com/bob",
        linkedin_url="https://linkedin.com/in/bob",
        current_workload=1,
        capacity=5,
        availability_status="Partially Available",
    )
    db.add_all([p1, p2])

    sprint = Sprint(name="Sprint 04", goal="Build dashboard and AI recommendation MVP")
    db.add(sprint)
    db.commit()
    db.refresh(sprint)

    tasks = [
        Task(
            title="Build dashboard API",
            description="Return sprint progress metrics",
            status="In Progress",
            required_skills="Python,SQL",
            assignee_id=u1.id,
            sprint_id=sprint.id,
        ),
        Task(
            title="Create profile form UI",
            description="Frontend form for editing developer profile",
            status="To Do",
            required_skills="React,JavaScript",
            assignee_id=u2.id,
            sprint_id=sprint.id,
        ),
        Task(
            title="Write notification logic",
            description="Detect stale and overloaded tasks",
            status="Done",
            required_skills="Python",
            assignee_id=u1.id,
            sprint_id=sprint.id,
        ),
    ]
    db.add_all(tasks)
    db.commit()
    db.close()