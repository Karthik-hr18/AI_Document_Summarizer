from pydantic import BaseModel, EmailStr, validator, constr

MAX_BCRYPT_LENGTH = 72

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: constr(min_length=8, max_length=MAX_BCRYPT_LENGTH)
    confirm_password: constr(min_length=8, max_length=MAX_BCRYPT_LENGTH)

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "password" in values and v != values["password"]:
            raise ValueError("Passwords do not match")
        return v

class UserLogin(BaseModel):
    username: str
    password: constr(min_length=8, max_length=MAX_BCRYPT_LENGTH)

class Token(BaseModel):
    access_token: str
    token_type: str
