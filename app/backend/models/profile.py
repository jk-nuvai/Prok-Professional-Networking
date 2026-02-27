from models.user import db


class Profile(db.Model):
    __tablename__ = 'profiles'

    id      = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    bio     = db.Column(db.Text, nullable=True)
    # Additional fields will be added in Day 3 (Profile UI/Backend)
