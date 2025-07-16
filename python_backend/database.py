from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class HealthData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(80), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    cpu_usage = db.Column(db.Float, nullable=False)
    heap_free = db.Column(db.Integer, nullable=False)
    min_heap_free = db.Column(db.Integer, nullable=False)
    task_count = db.Column(db.Integer, nullable=False)
    stack_hwm = db.Column(db.Integer, nullable=False)

    def __repr__(self):
        return f'<HealthData {self.device_id} at {self.timestamp}>'

    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'timestamp': self.timestamp.isoformat(),
            'cpu_usage': self.cpu_usage,
            'heap_free': self.heap_free,
            'min_heap_free': self.min_heap_free,
            'task_count': self.task_count,
            'stack_hwm': self.stack_hwm
        }

def init_db(app):
    """Initializes the database with the Flask app."""
    db.init_app(app)
    with app.app_context():
        db.create_all()
        print("Database initialized and tables created.")

