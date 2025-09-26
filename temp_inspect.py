from sqlalchemy import create_engine, text
from app.database import Base
import app.models  # noqa: F401

engine = create_engine('sqlite:///./test_dispute_domain.db', connect_args={'check_same_thread': False})
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
    print([row[0] for row in tables])
