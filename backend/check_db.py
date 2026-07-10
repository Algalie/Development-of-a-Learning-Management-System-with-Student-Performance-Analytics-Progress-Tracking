from app import create_app
from extensions import db
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    for table in tables:
        print(f'\n=== {table} ===')
        for col in inspector.get_columns(table):
            print(f'  {col["name"]} - {col["type"]}')
        for fk in inspector.get_foreign_keys(table):
            print(f'  FK: {fk}')