import os
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.db import Base
from app import models  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

load_dotenv()

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is not set")

# Normalize DATABASE_URL to use psycopg3 dialect if it's using standard postgresql://
# Railway and other providers often provide postgresql:// which SQLAlchemy interprets as psycopg2
# We use psycopg3 (psycopg package), so we need to convert it
if database_url.startswith("postgresql://") and "+psycopg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

config.set_main_option("sqlalchemy.url", database_url)

# Ensure alembic_version table can handle longer revision IDs
# Some revision IDs are longer than the default VARCHAR(32) limit
# This must happen before migrations run, so Alembic can update the version_num column
def ensure_alembic_version_column_length():
    """Ensure alembic_version.version_num column is large enough for long revision IDs."""
    from sqlalchemy import create_engine, inspect, text
    
    engine = None
    try:
        engine = create_engine(database_url)
        inspector = inspect(engine)
        
        # Check if alembic_version table exists
        if "alembic_version" in inspector.get_table_names():
            # Get column info
            columns = inspector.get_columns("alembic_version")
            version_num_col = next((col for col in columns if col["name"] == "version_num"), None)
            
            if version_num_col:
                # Check if it's VARCHAR(32) or smaller
                col_type = str(version_num_col["type"])
                if "VARCHAR" in col_type.upper() or "CHARACTER VARYING" in col_type.upper():
                    # Extract length if present (e.g., "VARCHAR(32)")
                    import re
                    match = re.search(r'\((\d+)\)', col_type)
                    if match:
                        length = int(match.group(1))
                        if length < 255:
                            # Alter column to VARCHAR(255)
                            with engine.connect() as conn:
                                conn.execute(text("ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR(255) USING version_num::VARCHAR(255)"))
                                conn.commit()
    except Exception:
        # If we can't alter the column, continue anyway - migrations might still work
        # or the column might already be the correct size
        pass
    finally:
        if engine:
            engine.dispose()

# Run this check before migrations
if not context.is_offline_mode():
    ensure_alembic_version_column_length()

target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
